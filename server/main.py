# server/main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import numpy as np
import json
import uuid
import os
import torch
import io
import zipfile
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from aggregator import RobustAggregator
from database import AsyncDatabase
from evaluator import Evaluator
from models import RobustCNN, restore_1d_to_model

app = FastAPI()

# Enable CORS for Next.js Frontend (port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Core Components
db = AsyncDatabase("asyncshield.db")
aggregator = RobustAggregator()
evaluator = Evaluator()

# Global Configuration
MAX_WEIGHTS = 500000  # Size for RobustCNN vector

# In-Memory Storage for weights (repo_id -> numpy array)
repo_weights_store = {}

# --- HELPER: INITIALIZE WEIGHTS ---
def get_initial_weights(model, target_size=MAX_WEIGHTS):
    weights = []
    state_dict = model.state_dict()
    for key in sorted(state_dict.keys()):
        weights.append(state_dict[key].cpu().numpy().flatten())
    flat_1d = np.concatenate(weights)
    if len(flat_1d) < target_size:
        padding = np.zeros(target_size - len(flat_1d))
        return np.concatenate([flat_1d, padding])
    return flat_1d[:target_size]

# --- REPOSITORY MANAGEMENT ---

@app.post("/create_repo")
async def create_repo(name: str = Form(...), description: str = Form(...), owner: str = Form(...)):
    """Orchestrator creates a new model project."""
    repo_id = str(uuid.uuid4())[:8]
    
    # Initialize with random RobustCNN brain
    initial_weights = get_initial_weights(RobustCNN())
    repo_weights_store[repo_id] = initial_weights
    
    db.create_repo(repo_id, name, description, owner)
    print(f"[ADMIN] New Repo Created: {name} ({repo_id})")
    return {"status": "success", "repo_id": repo_id}

@app.get("/repos")
def list_repos():
    """Returns all projects for the contributor dashboard."""
    return db.get_all_repos()

@app.get("/repos/{repo_id}/get_model")
def get_repo_model(repo_id: str):
    """Clients download current weights to start local training."""
    if repo_id not in repo_weights_store:
        # Recovery: If server restarted, re-init with random
        repo_weights_store[repo_id] = get_initial_weights(RobustCNN())
    
    repos = db.get_all_repos()
    repo_info = next((r for r in repos if r['id'] == repo_id), {"version": 1})
    
    return {
        "repo_id": repo_id,
        "version": repo_info["version"], 
        "weights": repo_weights_store[repo_id].tolist()
    }

# --- THE UNIFIED SUBMIT ENDPOINT (Direct Application) ---

@app.post("/repos/{repo_id}/submit_update")
async def submit_repo_update(
    repo_id: str, 
    client_id: str = Form(...), 
    client_version: int = Form(...), 
    file: UploadFile = File(...)
):
    print(f"\n[BINARY-UPLOAD] Request for Repo: {repo_id} from {client_id}")

    # 1. Memory Safety: Ensure weights exist for this repo
    if repo_id not in repo_weights_store:
        repo_weights_store[repo_id] = get_initial_weights(RobustCNN())

    # 2. Read and Parse .pth or .zip File
    pth_data = None
    try:
        contents = await file.read()
        print(f"[DEBUG] File received: {file.filename}, Size: {len(contents)} bytes")
        
        if not contents:
            return {"status": "error", "message": "File is empty. Please upload a valid file."}
        
        filename_lower = file.filename.lower() if file.filename else ""
        
        if filename_lower.endswith('.zip'):
            print(f"[DEBUG] Processing ZIP file: {file.filename}")
            zip_buffer = io.BytesIO(contents)
            
            try:
                with zipfile.ZipFile(zip_buffer, 'r') as zip_ref:
                    pth_files = [f for f in zip_ref.namelist() if f.endswith('.pth')]
                    print(f"[DEBUG] Files in ZIP: {zip_ref.namelist()}")
                    print(f"[DEBUG] Found {len(pth_files)} .pth files")
                    
                    if not pth_files:
                        return {"status": "error", "message": f"No .pth file found in ZIP. Files found: {', '.join(zip_ref.namelist())}"}
                    
                    pth_file_path = pth_files[0]
                    print(f"[DEBUG] Extracting .pth file: {pth_file_path}")
                    
                    with zip_ref.open(pth_file_path) as pth_file:
                        pth_contents = pth_file.read()
                        print(f"[DEBUG] .pth file size: {len(pth_contents)} bytes")
                        pth_buffer = io.BytesIO(pth_contents)
                        pth_data = torch.load(pth_buffer, map_location=torch.device('cpu'))
                        print(f"[DEBUG] Successfully loaded .pth from ZIP")
                        
            except zipfile.BadZipFile as ze:
                print(f"[ERROR] Bad ZIP file: {ze}")
                return {"status": "error", "message": f"Invalid ZIP file: {str(ze)}"}
            except Exception as ze:
                print(f"[ERROR] ZIP extraction error: {ze}")
                return {"status": "error", "message": f"Failed to extract from ZIP: {str(ze)}"}
                
        elif filename_lower.endswith('.pth'):
            print(f"[DEBUG] Processing direct .pth file: {file.filename}")
            pth_buffer = io.BytesIO(contents)
            try:
                pth_data = torch.load(pth_buffer, map_location=torch.device('cpu'))
                print(f"[DEBUG] Successfully loaded direct .pth file")
            except Exception as pth_err:
                print(f"[ERROR] Failed to load .pth: {pth_err}")
                return {"status": "error", "message": f"Invalid .pth file: {str(pth_err)}"}
        else:
            print(f"[DEBUG] Unknown extension, attempting auto-detection: {file.filename}")
            pth_buffer = io.BytesIO(contents)
            
            try:
                pth_data = torch.load(pth_buffer, map_location=torch.device('cpu'))
                print(f"[DEBUG] Auto-detected as .pth file")
            except:
                try:
                    pth_buffer.seek(0)
                    zip_buffer = io.BytesIO(contents)
                    with zipfile.ZipFile(zip_buffer, 'r') as zip_ref:
                        pth_files = [f for f in zip_ref.namelist() if f.endswith('.pth')]
                        if pth_files:
                            with zip_ref.open(pth_files[0]) as pth_file:
                                pth_contents = pth_file.read()
                                pth_buffer = io.BytesIO(pth_contents)
                                pth_data = torch.load(pth_buffer, map_location=torch.device('cpu'))
                                print(f"[DEBUG] Auto-detected as ZIP file")
                        else:
                            return {"status": "error", "message": "File format not recognized. Please upload a .pth file or .zip containing a .pth file."}
                except Exception as auto_err:
                    print(f"[ERROR] Auto-detection failed: {auto_err}")
                    return {"status": "error", "message": f"Cannot process file. Must be .pth or .zip. Error: {str(auto_err)[:100]}"}
        
        if pth_data is None:
            return {"status": "error", "message": "Failed to load file data. Please ensure your file is valid."}
        
        # Extract the delta (handles both raw tensor or dictionary format)
        try:
            if isinstance(pth_data, dict) and "weights_delta" in pth_data:
                delta = pth_data["weights_delta"].numpy()
                print(f"[DEBUG] Extracted weights_delta from dict")
            elif isinstance(pth_data, dict):
                print(f"[DEBUG] No 'weights_delta' found, assuming state_dict. Standardizing...")
                raw_weights = []
                for key in sorted(pth_data.keys()):
                    val = pth_data[key]
                    if hasattr(val, 'cpu'):
                        raw_weights.append(val.cpu().numpy().flatten())
                    elif hasattr(val, 'numpy'):
                        raw_weights.append(val.numpy().flatten())
                    else:
                        raw_weights.append(np.array(val).flatten())
                
                flat_1d = np.concatenate(raw_weights) if raw_weights else np.array([])
                
                if len(flat_1d) < MAX_WEIGHTS:
                    flat_1d = np.concatenate([flat_1d, np.zeros(MAX_WEIGHTS - len(flat_1d))])
                else:
                    flat_1d = flat_1d[:MAX_WEIGHTS]
                
                global_w = repo_weights_store.get(repo_id, np.zeros(MAX_WEIGHTS))
                delta = flat_1d - global_w
                print(f"[DEBUG] Computed delta automatically from full state_dict")

            else:
                delta = pth_data.numpy() if hasattr(pth_data, 'numpy') else np.array(pth_data)

            if len(delta.shape) > 1:
                delta = delta.flatten()
            
            if len(delta) < MAX_WEIGHTS:
                delta = np.concatenate([delta, np.zeros(MAX_WEIGHTS - len(delta))])
            elif len(delta) > MAX_WEIGHTS:
                delta = delta[:MAX_WEIGHTS]

            print(f"[DEBUG] Loaded binary weights. Size: {len(delta)}")
        except Exception as ext_err:
            print(f"[ERROR] Failed to extract weights: {ext_err}")
            return {"status": "error", "message": f"Failed to extract weights from file: {str(ext_err)}"}
        
    except Exception as e:
        print(f"[ERROR] File Parse Failed: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": f"File processing failed: {str(e)[:150]}"}

    # 3. Validate Dimensions
    if len(delta) != MAX_WEIGHTS:
        return {"status": "error", "message": f"Dim mismatch. Expected {MAX_WEIGHTS}, got {len(delta)}"}

    # 4. ZERO-TRUST EVALUATION
    global_weights = repo_weights_store[repo_id]
    real_delta_i, current_accuracy = evaluator.verify_update(global_weights, delta)
    
    print(f"[EVAL] Result for {client_id} -> ΔI: {real_delta_i*100:.4f}%")

    # 5. REJECTION LOGIC (Fraud & Quality)
    if real_delta_i < -0.015:
        db.add_commit(repo_id, client_id, "Rejected ❌", f"Fraud: Acc drop {abs(real_delta_i*100):.1f}%", "None", 0)
        return {"status": "rejected", "message": "Model poisoning detected."}

    if real_delta_i <= 0:
        db.add_commit(repo_id, client_id, "Rejected ❌", "No accuracy improvement", "None", 0)
        return {"status": "rejected", "message": "Your update did not improve the model."}

    # 6. CALCULATE TRUST & MERGE
    repos = db.get_all_repos()
    current_repo_v = next((r for r in repos if r['id'] == repo_id))['version']
    
    base_alpha = aggregator.calculate_staleness(current_repo_v, client_version)
    intel_boost = max(0, real_delta_i * 2.0)
    adaptive_trust = min(1.0, base_alpha + intel_boost)

    # Apply Weights Update: W_new = W_old + (LR * Trust) * Delta
    repo_weights_store[repo_id] = global_weights + (aggregator.lr * adaptive_trust) * delta
    
    # Update DB and Versioning
    new_version = current_repo_v + 1
    db.update_repo_version(repo_id, new_version)
    
    bounty = 5 + int(real_delta_i * 10000)
    db.add_user_tokens(client_id, bounty)
    db.add_commit(repo_id, client_id, "Merged ✅", f"Imp: {real_delta_i*100:.2f}% | Trust: {adaptive_trust:.2f}", f"v{current_repo_v}->v{new_version}", bounty)

    print(f"[SUCCESS] Repo {repo_id} upgraded to v{new_version}")
    return {"status": "success", "bounty": bounty, "version": new_version}

# --- DASHBOARD & UTILS ---

@app.get("/dashboard_data")
def get_dashboard_data():
    """Comprehensive data for Admin dashboard."""
    repos = db.get_all_repos()
    # For demo, we just return commits for the first repo or all
    all_commits = []
    for r in repos:
        all_commits.extend(db.get_repo_commits(r['id']))
    
    return {
        "repos": repos,
        "commits": all_commits[:20] # Last 20 commits globally
    }

@app.get("/download_architecture")
def download_architecture():
    return FileResponse("models.py", media_type="text/x-python", filename="models.py")


import subprocess
import shutil
import zipfile

# --- CLOUD COMPUTE SIMULATOR ---

@app.post("/compute/run")
async def run_cloud_compute(
    code: str = Form(...),
    dataset: UploadFile = File(...)
):
    """Simulates running user code on a cloud infrastructure with a provided dataset."""
    run_id = str(uuid.uuid4())
    run_dir = os.path.join("temp_runs", run_id)
    os.makedirs(run_dir, exist_ok=True)
    
    try:
        # 1. Save the code
        code_path = os.path.join(run_dir, "train.py")
        with open(code_path, "w") as f:
            f.write(code)
            
        # 2. Extract the dataset
        data_dir = os.path.join(run_dir, "data")
        os.makedirs(data_dir, exist_ok=True)
        
        zip_path = os.path.join(run_dir, "dataset.zip")
        with open(zip_path, "wb") as f:
            f.write(await dataset.read())
            
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(data_dir)
            
        # 3. Execute the code
        # We run the code in the run_dir so it can access ./data and save output.pth
        process = subprocess.Popen(
            ["python", "train.py"],
            cwd=run_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate()
        
        # 4. Check for output.pth
        output_pth = os.path.join(run_dir, "output.pth")
        if os.path.exists(output_pth):
            return {
                "status": "success",
                "message": "Execution completed successfully.",
                "logs": stdout + "\n" + stderr,
                "run_id": run_id
            }
        else:
            return {
                "status": "error",
                "message": "Execution finished, but 'output.pth' was not found. Make sure your code saves the model to 'output.pth'.",
                "logs": stdout + "\n" + stderr
            }
            
    except Exception as e:
        return {"status": "error", "message": str(e), "logs": ""}

@app.get("/compute/download/{run_id}")
async def download_compute_result(run_id: str):
    """Download the generated .pth file from a compute run."""
    output_pth = os.path.join("temp_runs", run_id, "output.pth")
    if os.path.exists(output_pth):
        return FileResponse(output_pth, media_type="application/octet-stream", filename=f"model_{run_id[:8]}.pth")
    raise HTTPException(status_code=404, detail="Model file not found.")

import subprocess
import shutil
import zipfile

# --- CLOUD COMPUTE SIMULATOR ---

@app.post("/compute/run")
async def run_cloud_compute(
    code: str = Form(...),
    dataset: UploadFile = File(...)
):
    """Simulates running user code on a cloud infrastructure with a provided dataset."""
    run_id = str(uuid.uuid4())
    run_dir = os.path.join("temp_runs", run_id)
    os.makedirs(run_dir, exist_ok=True)
    
    try:
        # 1. Save the code
        code_path = os.path.join(run_dir, "train.py")
        with open(code_path, "w") as f:
            f.write(code)
            
        # 2. Extract the dataset
        data_dir = os.path.join(run_dir, "data")
        os.makedirs(data_dir, exist_ok=True)
        
        zip_path = os.path.join(run_dir, "dataset.zip")
        with open(zip_path, "wb") as f:
            f.write(await dataset.read())
            
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(data_dir)
            
        # 3. Execute the code
        # We run the code in the run_dir so it can access ./data and save output.pth
        process = subprocess.Popen(
            ["python", "train.py"],
            cwd=run_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate()
        
        # 4. Check for output.pth
        output_pth = os.path.join(run_dir, "output.pth")
        if os.path.exists(output_pth):
            return {
                "status": "success",
                "message": "Execution completed successfully.",
                "logs": stdout + "\n" + stderr,
                "run_id": run_id
            }
        else:
            return {
                "status": "error",
                "message": "Execution finished, but 'output.pth' was not found. Make sure your code saves the model to 'output.pth'.",
                "logs": stdout + "\n" + stderr
            }
            
    except Exception as e:
        return {"status": "error", "message": str(e), "logs": ""}

@app.get("/compute/download/{run_id}")
async def download_compute_result(run_id: str):
    """Download the generated .pth file from a compute run."""
    output_pth = os.path.join("temp_runs", run_id, "output.pth")
    if os.path.exists(output_pth):
        return FileResponse(output_pth, media_type="application/octet-stream", filename=f"model_{run_id[:8]}.pth")
    raise HTTPException(status_code=404, detail="Model file not found.")

# --- USER AUTHENTICATION ---

@app.post("/auth/register")
async def register_user(username: str = Form(...), password: str = Form(...)):
    success = db.create_user(username, password)
    if success:
        return {"status": "success", "message": "User registered successfully."}
    return {"status": "error", "message": "Username already exists."}

@app.post("/auth/login")
async def login_user(username: str = Form(...), password: str = Form(...)):
    if db.verify_user(username, password):
        tokens = db.get_user_tokens(username)
        return {"status": "success", "username": username, "tokens": tokens}
    return {"status": "error", "message": "Invalid username or password."}

@app.get("/auth/user/{username}")
async def get_user_info(username: str):
    tokens = db.get_user_tokens(username)
    return {"username": username, "tokens": tokens}


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

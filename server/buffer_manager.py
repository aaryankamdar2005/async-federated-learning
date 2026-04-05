# server/buffer_manager.py
"""
Buffer Manager for Federated Learning
Accumulates weight deltas and triggers aggregation using Trimmed Mean
when buffer reaches threshold size or TTL expires
"""

import numpy as np
import time
from typing import Dict, List, Tuple
from datetime import datetime, timedelta

class BufferEntry:
    """Represents a single entry in the buffer"""
    def __init__(self, client_id: str, delta: np.ndarray, improvement: float, timestamp: float = None):
        self.client_id = client_id
        self.delta = delta
        self.improvement = improvement  # Accuracy improvement score
        self.timestamp = timestamp or time.time()
        self.is_first_entry = False  # Flag for bootstrap safety

    def __repr__(self):
        return f"BufferEntry(client={self.client_id}, improvement={self.improvement:.4f}, age={(time.time()-self.timestamp):.1f}s)"


class SubmissionBuffer:
    """
    Manages a buffer of weight submissions with TTL-based expiration
    
    PARAMETERS:
    - max_buffer_size: Trigger aggregation when this many entries accumulated
    - ttl_seconds: Automatically aggregate if buffer not full after this time
    - trim_percent: Remove this % from both ends of sorted improvements (e.g., 0.2 = 20%)
    - first_entry_multiplier: Trust multiplier for first entry (e.g., 1.5 = 50% more trust)
    """
    
    def __init__(self, repo_id: str, max_buffer_size: int = 3, ttl_seconds: int = 60, trim_percent: float = 0.2):
        self.repo_id = repo_id
        self.max_buffer_size = max_buffer_size
        self.ttl_seconds = ttl_seconds
        self.trim_percent = trim_percent
        
        self.buffer: List[BufferEntry] = []
        self.buffer_created_time = time.time()
        self.is_aggregating = False
        self.last_aggregation_time = 0
        
        print(f"[Buffer] Created for repo {repo_id}: max_size={max_buffer_size}, ttl={ttl_seconds}s, trim={int(trim_percent*100)}%")
    
    def add_entry(self, client_id: str, delta: np.ndarray, improvement: float) -> Tuple[bool, str]:
        """
        Add a new entry to the buffer
        Returns: (should_aggregate, reason)
        """
        # Check if buffer has expired
        if self._is_expired():
            print(f"[Buffer][{self.repo_id}] TTL expired. Aggregating partial buffer...")
            return True, "TTL_EXPIRED"
        
        # Create new entry
        entry = BufferEntry(client_id, delta, improvement)
        
        # Mark first entry
        if len(self.buffer) == 0:
            entry.is_first_entry = True
            print(f"[Buffer][{self.repo_id}] ⭐ FIRST ENTRY from {client_id} (bootstrap trusted)")
        
        self.buffer.append(entry)
        print(f"[Buffer][{self.repo_id}] Added {client_id}: Improvement={improvement:.4f}, Buffer={len(self.buffer)}/{self.max_buffer_size}")
        
        # Check if buffer is full
        if len(self.buffer) >= self.max_buffer_size:
            print(f"[Buffer][{self.repo_id}] Buffer FULL! Ready for aggregation.")
            return True, "BUFFER_FULL"
        
        return False, "BUFFERING"
    
    def _is_expired(self) -> bool:
        """Check if TTL has expired"""
        if len(self.buffer) == 0:
            return False
        elapsed = time.time() - self.buffer_created_time
        is_expired = elapsed > self.ttl_seconds
        if is_expired:
            print(f"[Buffer][{self.repo_id}] TTL Check: {elapsed:.1f}s > {self.ttl_seconds}s = EXPIRED")
        return is_expired
    
    def aggregate_trimmed_mean(self) -> Tuple[np.ndarray, List[dict], float]:
        """
        Aggregate buffer using TRIMMED MEAN with robust scoring
        
        Returns:
        - aggregated_delta: The weighted mean delta
        - metadata: List of entry info with scores
        - aggregation_confidence: Overall confidence score (0-1)
        """
        if not self.buffer:
            raise ValueError("Cannot aggregate empty buffer")
        
        print(f"\n[Aggregation] Starting for repo {self.repo_id}")
        print(f"[Aggregation] Buffer entries: {len(self.buffer)}")
        
        n = len(self.buffer)
        
        # ===== TIER 1: SINGLE ENTRY (Bootstrap) =====
        if n == 1:
            entry = self.buffer[0]
            print(f"[Aggregation] TIER 1: Single entry (bootstrap). Client: {entry.client_id}")
            metadata = [{
                'client_id': entry.client_id,
                'improvement': entry.improvement,
                'weight_score': 1.0,
                'is_first': True,
                'reason': 'Bootstrap entry - full trust'
            }]
            # Clear buffer and reset
            self._reset_buffer()
            return entry.delta, metadata, 1.0
        
        # ===== TIER 2: TWO ENTRIES (Similarity Check) =====
        if n == 2:
            return self._aggregate_tier2()
        
        # ===== TIER 3: THREE+ ENTRIES (Trimmed Mean) =====
        return self._aggregate_tier3()
    
    def _aggregate_tier2(self) -> Tuple[np.ndarray, List[dict], float]:
        """Two-entry aggregation with conflict detection"""
        entries = self.buffer
        e1, e2 = entries[0], entries[1]
        
        # Calculate cosine similarity
        norm1 = np.linalg.norm(e1.delta) + 1e-9
        norm2 = np.linalg.norm(e2.delta) + 1e-9
        cosine_sim = np.dot(e1.delta, e2.delta) / (norm1 * norm2)
        
        # Calculate improvement consensus
        avg_improvement = (e1.improvement + e2.improvement) / 2
        improvement_diff = abs(e1.improvement - e2.improvement)
        
        print(f"[Aggregation] TIER 2: Two entries")
        print(f"  - Cosine Similarity: {cosine_sim:.4f}")
        print(f"  - Improvements: {e1.improvement:.4f} vs {e2.improvement:.4f} (diff: {improvement_diff:.4f})")
        
        # Agreement threshold
        COSINE_THRESHOLD = 0.3
        IMPROVEMENT_CONSENSUS_THRESHOLD = 0.05
        
        # Case 1: High agreement and improvement consensus
        if cosine_sim > COSINE_THRESHOLD and improvement_diff < IMPROVEMENT_CONSENSUS_THRESHOLD:
            print(f"  → CONSENSUS: Both clients agree. Averaging deltas.")
            
            # Weight by improvement scores
            w1 = max(0.01, e1.improvement)  # Avoid zero weights
            w2 = max(0.01, e2.improvement)
            total_w = w1 + w2
            
            aggregated = (w1 * e1.delta + w2 * e2.delta) / total_w
            confidence = (cosine_sim + 0.5) / 1.5  # Normalize to 0-1
            
            metadata = [
                {'client_id': e1.client_id, 'improvement': e1.improvement, 'weight_score': w1/total_w, 'is_first': e1.is_first_entry, 'reason': 'Consensus entry'},
                {'client_id': e2.client_id, 'improvement': e2.improvement, 'weight_score': w2/total_w, 'is_first': e2.is_first_entry, 'reason': 'Consensus entry'}
            ]
            self._reset_buffer()
            return aggregated, metadata, confidence
        
        # Case 2: Conflict - pick best performer
        elif cosine_sim < 0.1 or improvement_diff > IMPROVEMENT_CONSENSUS_THRESHOLD:
            print(f"  → CONFLICT: Clients disagree. Selecting best performer.")
            best_idx = 0 if e1.improvement > e2.improvement else 1
            best_entry = entries[best_idx]
            other_entry = entries[1 - best_idx]
            
            # Penalize conflict
            conflict_penalty = 0.7
            confidence = (best_entry.improvement / max(best_entry.improvement, other_entry.improvement)) * conflict_penalty
            
            metadata = [
                {'client_id': best_entry.client_id, 'improvement': best_entry.improvement, 'weight_score': 1.0, 'is_first': best_entry.is_first_entry, 'reason': f'Better performer (selected)'},
                {'client_id': other_entry.client_id, 'improvement': other_entry.improvement, 'weight_score': 0.0, 'is_first': other_entry.is_first_entry, 'reason': 'Conflicting entry (rejected)'}
            ]
            self._reset_buffer()
            return best_entry.delta, metadata, confidence
        
        # Case 3: Moderate disagreement - weighted average
        else:
            print(f"  → MODERATE AGREEMENT: Weighted by improvements.")
            w1 = max(0.01, e1.improvement)
            w2 = max(0.01, e2.improvement)
            total_w = w1 + w2
            
            aggregated = (w1 * e1.delta + w2 * e2.delta) / total_w
            confidence = 0.6 + (cosine_sim * 0.1)  # Boost slightly if similar
            
            metadata = [
                {'client_id': e1.client_id, 'improvement': e1.improvement, 'weight_score': w1/total_w, 'is_first': e1.is_first_entry, 'reason': 'Weighted by improvement'},
                {'client_id': e2.client_id, 'improvement': e2.improvement, 'weight_score': w2/total_w, 'is_first': e2.is_first_entry, 'reason': 'Weighted by improvement'}
            ]
            self._reset_buffer()
            return aggregated, metadata, confidence
    
    def _aggregate_tier3(self) -> Tuple[np.ndarray, List[dict], float]:
        """
        Three+ entry aggregation using TRIMMED MEAN
        
        LOGIC:
        1. Sort entries by improvement score
        2. Remove bottom and top trim_percent (e.g., bottom 20%, top 20%)
        3. Weighted average of remaining entries
        4. Bootstrap safety: First entry always included
        """
        entries = self.buffer
        n = len(entries)
        
        print(f"[Aggregation] TIER 3: {n} entries - Using Trimmed Mean")
        
        # Ensure first entry is never trimmed (bootstrap safety)
        first_entry = None
        other_entries = []
        for entry in entries:
            if entry.is_first_entry:
                first_entry = entry
            else:
                other_entries.append(entry)
        
        print(f"  - Bootstrap entry: {first_entry.client_id if first_entry else 'None'}")
        
        # Calculate trim size
        trim_count = max(1, int(len(other_entries) * self.trim_percent))
        
        # Sort other entries by improvement
        sorted_entries = sorted(other_entries, key=lambda e: e.improvement)
        
        # Remove bottom and top trim_count
        remaining = sorted_entries[trim_count:-trim_count] if trim_count > 0 else sorted_entries
        
        print(f"  - Total: {n}, Trim count: {trim_count}")
        print(f"  - Removed worst {trim_count}: {[e.client_id for e in sorted_entries[:trim_count]]}")
        print(f"  - Removed best {trim_count}: {[e.client_id for e in sorted_entries[-trim_count:]]}")
        
        # Always include first entry
        selected_entries = [first_entry] + remaining
        
        print(f"  - Selected for aggregation ({len(selected_entries)} entries):")
        for e in selected_entries:
            print(f"      {e.client_id}: Imp={e.improvement:.4f}, First={e.is_first_entry}")
        
        # Weighted average - weight by improvement scores
        improvements = np.array([e.improvement for e in selected_entries])
        
        # Normalize improvements to weights (use softmax for stability)
        improvements_shifted = improvements - np.min(improvements) + 1e-9
        weights = improvements_shifted / np.sum(improvements_shifted)
        
        # Aggregate deltas
        deltas_array = np.array([e.delta for e in selected_entries])
        aggregated = np.average(deltas_array, axis=0, weights=weights)
        
        # Confidence score
        avg_improvement = np.mean(improvements)
        # Higher variance = lower confidence
        improvement_variance = np.var(improvements)
        confidence = 1.0 / (1.0 + improvement_variance)  # Sigmoid-like behavior
        
        print(f"  - Average improvement: {avg_improvement:.4f}")
        print(f"  - Improvement variance: {improvement_variance:.6f}")
        print(f"  - Aggregation confidence: {confidence:.4f}")
        
        # Build metadata
        metadata = []
        for i, entry in enumerate(selected_entries):
            is_trimmed = entry not in selected_entries[1:]  # First entry can't be trimmed
            metadata.append({
                'client_id': entry.client_id,
                'improvement': entry.improvement,
                'weight_score': weights[i],
                'is_first': entry.is_first_entry,
                'reason': 'Bootstrap' if entry.is_first_entry else 'Trimmed Mean Selected'
            })
        
        # Add trimmed entries info
        trimmed_entries = [e for e in sorted_entries[:trim_count]] + [e for e in sorted_entries[-trim_count:]]
        for entry in trimmed_entries:
            metadata.append({
                'client_id': entry.client_id,
                'improvement': entry.improvement,
                'weight_score': 0.0,
                'is_first': entry.is_first_entry,
                'reason': 'Trimmed (outlier)'
            })
        
        self._reset_buffer()
        return aggregated, metadata, confidence
    
    def _reset_buffer(self):
        """Reset buffer after aggregation"""
        self.buffer = []
        self.buffer_created_time = time.time()
        self.last_aggregation_time = time.time()
        print(f"[Buffer][{self.repo_id}] Buffer reset. Ready for new entries.")
    
    def get_buffer_status(self) -> Dict:
        """Return current buffer status"""
        elapsed = time.time() - self.buffer_created_time
        ttl_remaining = max(0, self.ttl_seconds - elapsed)
        
        return {
            'repo_id': self.repo_id,
            'entries': len(self.buffer),
            'max_size': self.max_buffer_size,
            'ttl_remaining': ttl_remaining,
            'elapsed': elapsed,
            'is_expired': self._is_expired(),
            'entries_detail': [
                {
                    'client_id': e.client_id,
                    'improvement': e.improvement,
                    'is_first': e.is_first_entry,
                    'age': time.time() - e.timestamp
                }
                for e in self.buffer
            ]
        }


class BufferManager:
    """Global buffer manager for all repositories"""
    
    def __init__(self):
        self.buffers: Dict[str, SubmissionBuffer] = {}
    
    def get_buffer(self, repo_id: str, max_size: int = 3, ttl: int = 60, trim: float = 0.2) -> SubmissionBuffer:
        """Get or create buffer for repo"""
        if repo_id not in self.buffers:
            self.buffers[repo_id] = SubmissionBuffer(repo_id, max_size, ttl, trim)
        return self.buffers[repo_id]
    
    def clear_buffer(self, repo_id: str):
        """Manually clear a buffer"""
        if repo_id in self.buffers:
            del self.buffers[repo_id]

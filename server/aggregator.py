# server/aggregator.py
import numpy as np

class RobustAggregator:
    def __init__(self, learning_rate=1.0, alpha=0.5):
        self.lr = learning_rate
        self.alpha = alpha # Staleness penalty sensitivity

    def calculate_staleness(self, global_version, client_version):
        """Calculates decay factor based on version lag."""
        lag = max(0, global_version - client_version)
        return 1.0 / (1.0 + self.alpha * lag)

    def apply_update(self, w_old, delta_aggregated, adaptive_trust):
        """
        W_new = W_old + (LR * Adaptive_Trust) * Delta_Aggregated
        """
        w_new = w_old + (self.lr * adaptive_trust) * delta_aggregated
        return w_new

    def aggregate_adaptive(self, deltas_list, improvements_list):
        """
        The Three-Tier Defense Logic
        """
        n = len(deltas_list)

        # --- TIER 1: SINGLE CLIENT (N=1) ---
        if n == 1:
            print("[Aggregator] Tier 1: Single update. Relying on Zero-Trust Verification.")
            return deltas_list[0]

        # --- TIER 2: TWO CLIENTS (N=2) - Similarity Check ---
        if n == 2:
            u1, u2 = deltas_list[0], deltas_list[1]
            
            # Calculate Cosine Similarity
            norm1 = np.linalg.norm(u1) + 1e-9
            norm2 = np.linalg.norm(u2) + 1e-9
            similarity = np.dot(u1, u2) / (norm1 * norm2)
            
            print(f"[Aggregator] Tier 2: Two updates. Cosine Similarity: {similarity:.4f}")

            if similarity > 0.4: # They mostly agree in direction
                return np.mean(deltas_list, axis=0)
            else:
                # They are conflicting! We pick the one that improved accuracy the most.
                print("[Aggregator] Conflict detected! Choosing update with higher accuracy gain.")
                best_idx = np.argmax(improvements_list)
                return deltas_list[best_idx]

        # --- TIER 3: MULTIPLE CLIENTS (N>=3) - Trimmed Mean ---
        print(f"[Aggregator] Tier 3: Robust Consensus. Trimming outliers from {n} updates.")
        stacked = np.vstack(deltas_list)
        trim_ratio = 0.2
        trim_count = max(1, int(n * trim_ratio))
        
        sorted_updates = np.sort(stacked, axis=0)
        # Remove top and bottom 20%
        trimmed_mean = np.mean(sorted_updates[trim_count : -trim_count], axis=0)
        return trimmed_mean
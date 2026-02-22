from opacus import PrivacyEngine

class PrivacyWrapper:
    def __init__(self, target_epsilon=10.0, target_delta=1e-5, max_grad_norm=1.2):
        self.privacy_engine = PrivacyEngine()
        self.epsilon = target_epsilon
        self.delta = target_delta
        self.max_grad_norm = max_grad_norm

    def make_private(self, model, optimizer, dataloader, epochs):
        """Attaches Opacus DP Engine to the PyTorch training objects."""
        model, optimizer, dataloader = self.privacy_engine.make_private_with_epsilon(
            module=model,
            optimizer=optimizer,
            data_loader=dataloader,
            epochs=epochs,
            target_epsilon=self.epsilon,
            target_delta=self.delta,
            max_grad_norm=self.max_grad_norm,
        )
        return model, optimizer, dataloader
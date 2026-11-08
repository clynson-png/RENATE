# Whisper Tiny multilingual — RENATE model asset

This folder contains the q8 ONNX export used by RENATE.

- Export repository: `onnx-community/whisper-tiny`
- Pinned export revision: `ff4177021cc41f7db950912b73ea4fdf7d01d8e7`
- Base checkpoint: `openai/whisper-tiny`
- Pinned base revision: `169d4a4341b33bc18d8881c4b69c2e104e1cc0af`
- Export commit lists Xenova and whitphx as contributors. The export model card identifies the OpenAI checkpoint as its base and describes ONNX compatibility; it declares no separate license tag.
- `PROVENANCE.json` records file sizes and SHA-256 hashes. `licenses/` retains the MIT license from OpenAI Whisper and Apache-2.0 text matching the base checkpoint's Hugging Face card declaration. The two upstream sources state different permissive licenses; RENATE preserves both texts and attribution notices rather than deleting either notice.
- No ONNX conversion source code is redistributed in this folder. The model files are the unchanged q8 files at the pinned export revision.

Sources:

- Export revision and files: https://huggingface.co/onnx-community/whisper-tiny/tree/ff4177021cc41f7db950912b73ea4fdf7d01d8e7
- Base model revision/card: https://huggingface.co/openai/whisper-tiny/tree/169d4a4341b33bc18d8881c4b69c2e104e1cc0af
- OpenAI repository statement for model weights and code: https://github.com/openai/whisper/blob/main/README.md#license

# Models (Sentiment Analysis)

This folder contains configuration and tokenizer assets for four sentiment analysis models used in this project:

- BERT (`models/bert_sentiment`)
- DistilBERT (`models/distilbert_sentiment`)
- RoBERTa (`models/roberta_sentiment`)
- XLM-RoBERTa (`models/xlm_roberta_sentiment`)

Model weight files (e.g. `model.safetensors`) are large and are managed separately to avoid hitting GitHub size/LFS limits.

## Folder Structure

```
models/
  bert_sentiment/
    config.json
    special_tokens_map.json
    tokenizer.json
    tokenizer_config.json
    vocab.txt
    model.safetensors        # not pushed by default

  distilbert_sentiment/
    config.json
    special_tokens_map.json
    tokenizer.json
    tokenizer_config.json
    vocab.txt
    model.safetensors        # not pushed by default

  roberta_sentiment/
    config.json
    merges.txt
    special_tokens_map.json
    tokenizer.json
    tokenizer_config.json
    vocab.json
    model.safetensors        # not pushed by default

  xlm_roberta_sentiment/
    config.json
    sentencepiece.bpe.model
    special_tokens_map.json
    tokenizer.json
    tokenizer_config.json
    model.safetensors        # ~1.1 GB, not pushed by default
```

## Getting the Weights

You have two options:

### Option A: Use Git LFS (recommended if you have quota)

If your repository has enough Git LFS quota, you can track and push the weights via LFS.

```bash
# One-time setup (already tracked for *.safetensors)
git lfs install
# Track safetensors (already done)
git lfs track "*.safetensors"

# Stage and commit large weights
git add models/*/model.safetensors
git commit -m "Add safetensors weights via LFS"
# Push to the target remote/branch
git push origin main
```

Note: GitHub’s free LFS quota is limited; very large files (e.g. XLM-R ~1.1 GB) may require paid LFS data packs.

### Option B: Keep weights out of the repo and download locally

Place the corresponding `model.safetensors` files in each model folder on your machine or deployment server. You can host them on your own storage (e.g., S3, Google Drive, Hugging Face Hub). Example download approach:

```bash
# Example using huggingface-cli (replace with your model repo)
# pip install -U huggingface_hub
huggingface-cli download <your-org>/<your-model-repo> --include "*.safetensors" --local-dir models/bert_sentiment
huggingface-cli download <your-org>/<your-model-repo> --include "*.safetensors" --local-dir models/distilbert_sentiment
huggingface-cli download <your-org>/<your-model-repo> --include "*.safetensors" --local-dir models/roberta_sentiment
huggingface-cli download <your-org>/<your-model-repo> --include "*.safetensors" --local-dir models/xlm_roberta_sentiment
```

Alternatively, use `curl`/`wget` from your hosted URLs and save to the respective model folder.

## Usage (Python example)

If you use Python for inference, you can load a local folder with `transformers`:

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_dir = "models/roberta_sentiment"  # choose one

tokenizer = AutoTokenizer.from_pretrained(model_dir)
model = AutoModelForSequenceClassification.from_pretrained(model_dir)

inputs = tokenizer("This movie was amazing!", return_tensors="pt")
outputs = model(**inputs)
print(outputs.logits)
```

## Notes

- Do not commit huge weights directly without LFS; pushes may be rejected.
- Line ending warnings (LF/CRLF) are benign for JSON/txt tokenizer files.
- Ensure your deployment has enough disk/RAM for loading the selected model.
- If you need me to add an automated download script and integrate it into your build/deploy flow, let me know.

# AirGap (Local CodeGemma Inline Completion)

**AirGap** is a lightweight, local Visual Studio Code extension that provides inline code completions using a local [Ollama](https://ollama.com/) instance running the `codegemma:2b` model.

This extension was created as a **one-day weekend project** to explore and understand the raw prompting technique with Ollama for Fill-in-the-Middle (FIM) code completion.

## Demo

![AirGap Demo](demo.mp4)

*(If the video doesn't play automatically, you can watch it here: [demo.mp4](demo.mp4))*


## Features

- **Local Inline Completions**: Automatically suggests code inline as you type, powered by your local Ollama setup.
- **Raw Prompting (FIM)**: Employs direct Fill-in-the-Middle raw prompting using document prefixes and suffixes to prompt the `codegemma:2b` model.
- **Debounced Requests**: Implements a simple debounce mechanism to minimize unnecessary LLM invocation/network calls as you type.
- **Auto-aborting**: Cancelled requests automatically abort the fetch request to free up Ollama resources.

## Requirements

1. **Ollama**: Ensure [Ollama](https://ollama.com/) is installed and running on your system.
2. **CodeGemma**: Download the `codegemma:2b` model:
   ```bash
   ollama run codegemma:2b
   ```
3. The extension communicates with Ollama at its default endpoint: `http://localhost:11434`.

## Technical Details

The extension registers an `InlineCompletionItemProvider` for all file patterns. When triggered, it grabs up to 2000 characters before the cursor (prefix) and 2000 characters after the cursor (suffix) and constructs a raw FIM query to Ollama:

```json
{
  "raw": true,
  "model": "codegemma:2b",
  "prompt": "<prefix>",
  "suffix": "<suffix>",
  "stream": false,
  "options": {
    "num_predict": 64,
    "temperature": 0.0,
    "stop": ["<|fim_prefix|>", "<|fim_suffix|>", "<|fim_middle|>", "<|file_separator|>", "\n\n", "\r\n"]
  }
}
```

## Enjoy!

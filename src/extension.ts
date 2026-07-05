import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('AirGap (Local CodeGemma Completion) with Debounce is active!');
	let debounceTimeout: NodeJS.Timeout | undefined;

	const provider: vscode.InlineCompletionItemProvider = {
		async provideInlineCompletionItems(
			document: vscode.TextDocument,
			position: vscode.Position,
			context: vscode.InlineCompletionContext,
			token: vscode.CancellationToken
		): Promise<vscode.InlineCompletionList | undefined> {

			if (debounceTimeout) {
				clearTimeout(debounceTimeout);
			}

			await new Promise<void>((resolve, reject) => {
				debounceTimeout = setTimeout(() => resolve(), 10);

				token.onCancellationRequested(() => {
					if (debounceTimeout) clearTimeout(debounceTimeout);
					reject(new Error('Debounce cancelled'));
				});
			}).catch(() => undefined);

			if (token.isCancellationRequested) {
				return undefined;
			}

			const fullText = document.getText();
			const cursorOffset = document.offsetAt(position);

			const prefix = fullText.substring(Math.max(0, cursorOffset - 2000), cursorOffset);
			const suffix = fullText.substring(cursorOffset, Math.min(fullText.length, cursorOffset + 2000));

			if (!prefix.trim()) { return undefined; }

			const abortController = new AbortController();
			token.onCancellationRequested(() => {
				abortController.abort();
			});

			try {
				const response = await fetch('http://localhost:11434/api/generate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					signal: abortController.signal,
					body: JSON.stringify({
						raw: true,
						model: 'codegemma:2b',
						prompt: prefix,
						suffix: suffix,
						stream: false,
						options: {
							num_predict: 64,
							temperature: 0.0,
							stop: ['<|fim_prefix|>', '<|fim_suffix|>', '<|fim_middle|>', '<|file_separator|>', '\n\n', '\r\n']
						}
					})
				});

				if (!response.ok) {
					throw new Error(`Ollama error: ${response.status}`);
				}

				const data = await response.json() as { response: string };
				const completionText = data.response;

				if (!completionText || !completionText.trim()) {
					return undefined;
				}

				const completionItem = new vscode.InlineCompletionItem(completionText);
				completionItem.range = new vscode.Range(position, position);

				return { items: [completionItem] };

			} catch (error: any) {
				if (error.name === 'AbortError' || error.message === 'Debounce cancelled') {
					return undefined;
				}
				console.error('AirGap Error:', error);
				return undefined;
			}
		}
	};

	const disposable = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, provider);
	context.subscriptions.push(disposable);
}

export function deactivate() { }
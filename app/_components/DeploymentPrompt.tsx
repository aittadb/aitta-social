import deploymentPromptContent from "@/content/deployment-prompt.json";

export function DeploymentPrompt() {
  return (
    <div className="deployment-prompt">
      <label htmlFor="deployment-prompt">Prompt for ChatGPT</label>
      <p id="deployment-prompt-help">
        Select and copy this prompt into ChatGPT to set up your own Aitta.
      </p>
      <textarea
        id="deployment-prompt"
        aria-describedby="deployment-prompt-help"
        readOnly
        rows={8}
        value={deploymentPromptContent.prompt}
      />
    </div>
  );
}

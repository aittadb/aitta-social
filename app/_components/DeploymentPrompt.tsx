import deploymentPromptContent from "@/content/deployment-prompt.json";

export function DeploymentPrompt() {
  return (
    <div className="deployment-prompt">
      <label htmlFor="deployment-prompt">Prompt for ChatGPT</label>
      <p id="deployment-prompt-help">
        Select and copy this prompt into ChatGPT to create your own presence.
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

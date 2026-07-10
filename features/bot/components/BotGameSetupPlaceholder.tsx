interface BotGameSetupPlaceholderProps {
  title: string;
  description: string;
}

export function BotGameSetupPlaceholder({ title, description }: BotGameSetupPlaceholderProps) {
  return (
    <div className="setup-screen">
      <div className="setup-screen__scroll">
        <p className="setup-page__placeholder-copy">
          <strong>{title}</strong> bot setup is coming soon. {description}
        </p>
      </div>
    </div>
  );
}

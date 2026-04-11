type AuthErrorAlertProps = {
  errorMessage: string;
};

export default function AuthErrorAlert({ errorMessage }: AuthErrorAlertProps) {
  if (!errorMessage) {
    return null;
  }

  return (
    <div className="rounded-medium border border-destructive/35 bg-destructive/10 p-3 shadow-subtle">
      <p className="text-sm tracking-body text-destructive">{errorMessage}</p>
    </div>
  );
}

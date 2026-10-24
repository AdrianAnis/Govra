function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }
  return (
    <p role="alert" className="text-sm font-medium text-fg">
      {message}
    </p>
  );
}

export { FieldError };

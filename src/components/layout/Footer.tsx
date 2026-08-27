export function Footer() {
  return (
    <footer className="border-t border-edge/80 bg-background/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="cv-label">CipherVault · Data hiding &amp; cryptography toolkit</p>
        <p className="cv-label">
          Payloads processed in-memory · never stored, never logged
        </p>
      </div>
    </footer>
  );
}

export default Footer;

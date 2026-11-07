type Props = {
  label: string;
  href: string;
  tint: string;
  file?: boolean;
};

export default function FolderIcon({ label, href, tint, file }: Props) {
  return (
    <a href={href} className="group flex w-21 flex-col items-center gap-1.5 font-mono text-xs">
      <span
        className={`${file ? 'file-icon' : 'folder'} ${tint} transition-transform duration-150 group-hover:-translate-y-1 group-hover:-rotate-3`}
      />
      {label}
    </a>
  );
}

import { cn } from "@/lib/utils";

export function FolderSvg({ className }: { className?: string }) {
  return (
    <svg
      className={cn("translate-y-[0.5px]", className)}
      width="267"
      height="48"
      viewBox="0 0 267 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M28.6921 7.64446L12.3849 40.3617C10.0774 45.0367 5.26944 47.9994 0 47.9994L267 48C261.731 48 256.923 45.0306 254.615 40.3555L238.308 7.64446C236 2.96945 231.269 0 226 0H41C35.7305 0 30.9996 2.96945 28.6921 7.64446Z"
        fill="currentColor"
      />
    </svg>
  );
}

import Image from "next/image";

interface BackdropImageProps {
  src: string;
  position?: string;
}

function BackdropImage({ src, position = "center" }: BackdropImageProps) {
  return (
    <Image
      src={src}
      alt=""
      fill
      priority
      sizes="100vw"
      quality={60}
      style={{ objectPosition: position }}
      className="-z-20 object-cover"
    />
  );
}

export { BackdropImage };

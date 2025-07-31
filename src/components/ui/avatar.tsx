import * as React from "react"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

function Avatar({ className = "", ...props }: AvatarProps) {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    />
  )
}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

function AvatarImage({ className = "", ...props }: AvatarImageProps) {
  return (
    <img className={`aspect-square h-full w-full ${className}`} {...props} />
  )
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

function AvatarFallback({ className = "", ...props }: AvatarFallbackProps) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-gray-700 text-gray-300 ${className}`}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }

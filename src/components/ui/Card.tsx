import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}
      {...rest}
    />
  )
}

export function CardHeader({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 ${className}`} {...rest} />
}

export function CardBody({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 ${className}`} {...rest} />
}

export function CardTitle({ className = '', ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-sm font-semibold text-slate-900 dark:text-slate-100 ${className}`} {...rest} />
}

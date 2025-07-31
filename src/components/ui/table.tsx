import * as React from "react"

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

function Table({ className = "", ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={`w-full caption-bottom text-sm ${className}`}
        {...props}
      />
    </div>
  )
}

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

function TableHeader({ className = "", ...props }: TableHeaderProps) {
  return <thead className={`[&_tr]:border-b border-gray-700 ${className}`} {...props} />
}

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

function TableBody({ className = "", ...props }: TableBodyProps) {
  return (
    <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
  )
}

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

function TableFooter({ className = "", ...props }: TableFooterProps) {
  return (
    <tfoot className={`bg-gray-800 font-medium [&>tr]:last:border-b-0 ${className}`} {...props} />
  )
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

function TableRow({ className = "", ...props }: TableRowProps) {
  return (
    <tr
      className={`border-b border-gray-700 transition-colors hover:bg-gray-800/50 data-[state=selected]:bg-gray-800 ${className}`}
      {...props}
    />
  )
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

function TableHead({ className = "", ...props }: TableHeadProps) {
  return (
    <th
      className={`h-12 px-4 text-left align-middle font-medium text-gray-400 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  )
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

function TableCell({ className = "", ...props }: TableCellProps) {
  return (
    <td
      className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  )
}

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

function TableCaption({ className = "", ...props }: TableCaptionProps) {
  return (
    <caption className={`mt-4 text-sm text-gray-400 ${className}`} {...props} />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

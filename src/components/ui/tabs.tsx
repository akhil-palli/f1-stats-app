import * as React from "react"

// Module-level storage for persisting tab states
const persistedTabStates = new Map<string, string>()

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  persistKey?: string // Add a key for persistence
}

export const TabsContext = React.createContext<{
  value: string
  setValue: (value: string) => void
}>({
  value: "",
  setValue: () => {}
})

function Tabs({ defaultValue, persistKey, children, className = "", ...props }: TabsProps) {
  // Get initial value from persistence or use default
  const getInitialValue = () => {
    if (persistKey && persistedTabStates.has(persistKey)) {
      return persistedTabStates.get(persistKey)!
    }
    return defaultValue
  }
  
  const [value, setValue] = React.useState(getInitialValue)
  
  // Custom setValue that also persists the value
  const setValueWithPersistence = React.useCallback((newValue: string) => {
    setValue(newValue)
    if (persistKey) {
      persistedTabStates.set(persistKey, newValue)
    }
  }, [persistKey])
  
  return (
    <TabsContext.Provider value={{ value, setValue: setValueWithPersistence }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

function TabsList({ className = "", ...props }: TabsListProps) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-800 p-1 text-gray-400 grid w-full ${className}`}
      {...props}
    />
  )
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

function TabsTrigger({ className = "", value, ...props }: TabsTriggerProps) {
  const { value: selectedValue, setValue } = React.useContext(TabsContext)
  const isSelected = selectedValue === value
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected 
          ? "bg-gray-700 text-white shadow-sm" 
          : "text-gray-400 hover:text-white"
      } ${className}`}
      onClick={() => setValue(value)}
      {...props}
    />
  )
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

function TabsContent({ className = "", value, ...props }: TabsContentProps) {
  const { value: selectedValue } = React.useContext(TabsContext)
  
  if (selectedValue !== value) return null
  
  return (
    <div
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

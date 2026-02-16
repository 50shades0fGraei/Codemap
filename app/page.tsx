"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Html } from "@react-three/drei" // Import Html for 3D labels
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"

interface ProcessNode {
  index: number
  coords: [number, number, number]
  strand: number
  base: string
  complement: string
  angle: number
  base_pair_id: string
  command?: string
  category?: string
  is_fork?: boolean
  fork_type?: "if" | "else" | "loop" | "function_call" | "merge" | "conditional"
  parent_index?: number
  fork_direction?: "left" | "right"
  spiral_id?: string
  isDuplicate?: boolean
  referenceTo?: number
  duplicateCount?: number
  references?: number[]
  address?: string // Added address property
  functionName?: string // Added functionName property
  code?: string // Added code property
  lines?: string[] // Added lines property
}

// Define DNAProcess interface based on ProcessNode for clarity
interface DNAProcess extends ProcessNode {}

interface ForkSpiral {
  id: string
  nodes: ProcessNode[]
  fork_type: string
  parent_node: number
  merge_node?: number
  direction: "left" | "right"
}

interface MapData {
  address: string
  command: string
  coords: [number, number, number]
  subprocesses: string[]
  direction: string | null
  category?: string
}

interface FunctionBlock {
  id: string
  name: string
  startAddress: number
  endAddress: number
  addresses: number[]
  lineComposition: string[]
  originalLines: string[]
  optimizedLines: string[]
  duplicateReplacements: { [key: string]: string }
  category: string
  description: string
  efficiency: number // Added efficiency property
}

interface FileAnalysis {
  fileName: string
  fileType: string
  totalLines: number
  duplicateLines: number
  uniqueLines: number
  energySavings: number
  optimizationPotential: number
  functionBlocks: number
  categories: { [key: string]: number }
}

interface ProjectAnalysis {
  totalFiles: number
  totalLines: number
  totalDuplicates: number
  overallEnergySavings: number
  optimizationPotential: number
  fileAnalyses: FileAnalysis[]
  globalDuplicates: { [key: string]: string[] }
}

interface AddressRegistry {
  [key: string]: {
    node: ProcessNode
    index: number
    dependencies: string[]
    executionFunction: () => Promise<any>
  }
}

interface PipelineCall {
  addressId?: string
  fromAddress?: string
  toAddress?: string
  timestamp: number
  status: "pending" | "summoning" | "executing" | "completed" | "failed"
  dependencies?: string[]
}

interface LibraryFunction {
  id: string
  name: string
  description: string
  code: string
  parameters: string[]
  returnType: string
  category: string
  tags: string[]
  dnaAddress: string
  usageCount: number
  dateCreated: string
  author: string
  address?: string // Added address property for library functions
  project?: string // Added project property for library functions
}

interface TerminalOutput {
  id: string
  type: "input" | "output" | "error" | "system"
  content: string
  timestamp: number
}

interface DeveloperProject {
  id: string
  name: string
  dnaStrands: { [key: string]: string[] }
  usedFunctions: { [key: string]: string }
  projectLibrary: LibraryFunction[]
  createdAt: string // Added for project creation timestamp
}

interface RolodexWindow {
  id: string
  title: string
  type: "editor" | "library" | "terminal" | "visualization" | "chat"
  component: React.ReactNode
  isActive: boolean
}

// Added window state interface for desktop windows
interface WindowState {
  id: string
  title: string
  type: "editor" | "library" | "terminal" | "visualization" | "chat"
  x: number
  y: number
  width: number
  height: number
  isMinimized: boolean
  zIndex: number
  isActive: boolean
}

interface DNAToFileConversion {
  fileName: string
  fileType: string
  content: string
  dnaAddresses: string[]
  createdAt: string
  sourceProject: string
}

interface FileTransmissionRecord {
  id: string
  fileName: string
  size: number
  status: "pending" | "sending" | "received" | "failed"
  timestamp: number
  recipientAddress?: string
  sourceAddress?: string
}

interface ProjectFunctionGroup {
  projectId: string
  projectName: string
  functions: LibraryFunction[]
}

interface AnimationState {
  activeAddresses: string[]
  flowingData: Array<{ from: string; to: string; progress: number }>
  pulsingNodes: string[]
}

interface GenomeNode {
  id: string
  name: string
  hierarchicalAddress: string // P.F.O.G format (Program.Function.Order.Global)
  traits: string[]
  spawnPoint: boolean
  parentGenome?: string
  childGenomes: string[]
  priority: number
  workflow: string[]
  functionalProcesses: string[]
  dnaAddress: string
  category: string
}

interface AIAgent {
  id: string
  name: string
  spawnPoint: GenomeNode
  inheritedTraits: string[]
  purpose: string
  priorities: string[]
  workflows: string[]
  activeGenomes: string[]
  addressLibrary: { [key: string]: string }
}

interface HierarchicalAddress {
  program: string // 1st letter of program/repo name
  function: string // 2nd letter for function/category name
  order: number // Order in program
  global: number // Global library number
  fullAddress: string // Combined format: P.F.O.G
}

const convertDNAToFile = (
  functionBlocks: FunctionBlock[],
  spiralNodes: ProcessNode[],
  projectName: string,
  fileType = "js",
): DNAToFileConversion => {
  let content = ""

  // Add header comment
  content += `// Generated from CodeMap DNA Strand\n`
  content += `// Project: ${projectName}\n`
  content += `// Generated: ${new Date().toISOString()}\n`
  content += `// DNA Structure: ${functionBlocks.length} function blocks\n\n`

  // Convert each function block to code
  functionBlocks.forEach((block) => {
    content += `// Function Block: ${block.name} (${block.id})\n`
    content += `// Addresses: ${block.addresses.join(" ")}\n`
    content += `// Efficiency: ${Math.round((1 - block.optimizedLines.length / block.originalLines.length) * 100)}% reduction\n`
    content += `function ${block.name.replace(/\s+/g, "_").toLowerCase()}() {\n`

    // Add the actual code lines from the spiral nodes
    block.addresses.forEach((addr) => {
      const node = spiralNodes[addr]
      if (node) {
        content += `  // Address: ${node.address} (${node.category})\n`
        if (node.code) {
          content += `  ${node.code.split("\n").join("\n  ")}\n`
        } else {
          content += `  // ${node.command}\n`
        }
      }
    })

    content += `}\n\n`
  })

  // Add all individual addresses as separate functions
  content += `// Individual Address Functions\n`
  spiralNodes.forEach((node) => {
    if (!functionBlocks.some((b) => b.addresses.includes(node.index))) {
      content += `function ${node.functionName || `address_${node.address}`}() {\n`
      if (node.code) {
        content += `  ${node.code.split("\n").join("\n  ")}\n`
      } else {
        content += `  // ${node.command}\n`
      }
      content += `}\n\n`
    }
  })

  // Add export statements based on file type
  if (fileType === "ts" || fileType === "tsx") {
    content += `export default { ...functions };\n`
  } else if (fileType === "py") {
    content = content
      .replace(/function /g, "def ")
      .replace(/\{/g, ":")
      .replace(/\}/g, "")
  }

  return {
    fileName: `codemap-${projectName.replace(/\s+/g, "-").toLowerCase()}.${fileType}`,
    fileType,
    content,
    dnaAddresses: spiralNodes.map((n) => n.address || ""),
    createdAt: new Date().toISOString(),
    sourceProject: projectName,
  }
}

const exportDNAAsFile = (conversion: DNAToFileConversion) => {
  const element = document.createElement("a")
  const file = new Blob([conversion.content], { type: "text/plain" })
  element.href = URL.createObjectURL(file)
  element.download = conversion.fileName
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

const importFileAsDNA = async (file: File): Promise<ProcessNode[]> => {
  const content = await file.text()
  const lines = content.split("\n")

  const nodes: ProcessNode[] = []
  let addressCounter = 1

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith("//") && trimmedLine.length > 0) {
      const functionMatch = trimmedLine.match(/function\s+(\w+)/)
      const functionName = functionMatch ? functionMatch[1] : `imported_${addressCounter}`

      nodes.push({
        index: nodes.length,
        coords: [
          Math.cos((nodes.length / 50) * Math.PI * 5) * 10,
          25 - nodes.length * 0.5,
          Math.sin((nodes.length / 50) * Math.PI * 5) * 10,
        ] as [number, number, number],
        strand: nodes.length % 2,
        base: ["A", "T", "C", "G"][nodes.length % 4],
        complement: ["T", "A", "G", "C"][nodes.length % 4],
        angle: 0,
        base_pair_id: `bp-${nodes.length}`,
        command: trimmedLine,
        category: "imported",
        address: `a${addressCounter}`,
        functionName,
        code: trimmedLine,
      })
      addressCounter++
    }
  })

  return nodes
}

const createTransmissionRecord = (fileName: string, fileSize: number): FileTransmissionRecord => ({
  id: `trans-${Date.now()}`,
  fileName,
  size: fileSize,
  status: "pending",
  timestamp: Date.now(),
})

const COMMAND_LIBRARY = {
  // DNA Address Commands
  address: {
    description: "Execute function at DNA address",
    usage: "a<number> (e.g., a5, a12)",
    category: "DNA Operations",
  },
  run: {
    description: "Execute function at DNA address",
    usage: "run <address> (e.g., run a5)",
    category: "DNA Operations",
  },
  summon: {
    description: "Summon and execute address with full pipeline display",
    usage: "summon <address> (e.g., summon a5)",
    category: "DNA Operations",
  },

  // Function Library Commands
  search: {
    description: "Search function library",
    usage: "search <query> (e.g., search authentication)",
    category: "Function Library",
  },
  save: {
    description: "Save current function to library",
    usage: "save <name> <description>",
    category: "Function Library",
  },
  list: {
    description: "List all functions in library",
    usage: "list [category]",
    category: "Function Library",
  },

  // Project Management
  project: {
    description: "Show current project info",
    usage: "project",
    category: "Project Management",
  },
  new: {
    description: "Create new project",
    usage: "new <project_name>",
    category: "Project Management",
  },
  load: {
    description: "Load project",
    usage: "load <project_name>",
    category: "Project Management",
  },

  // Code Analysis
  analyze: {
    description: "Analyze code for duplicates and optimization",
    usage: "analyze [file_path]",
    category: "Code Analysis",
  },
  optimize: {
    description: "Show optimization suggestions",
    usage: "optimize",
    category: "Code Analysis",
  },
  stats: {
    description: "Show code statistics and efficiency metrics",
    usage: "stats",
    category: "Code Analysis",
  },

  // System Commands
  clear: {
    description: "Clear terminal output",
    usage: "clear",
    category: "System",
  },
  help: {
    description: "Show available commands",
    usage: "help [command] or help [category]",
    category: "System",
  },
  version: {
    description: "Show CodeMap version info",
    usage: "version",
    category: "System",
  },

  // Development Tools
  debug: {
    description: "Toggle debug mode",
    usage: "debug [on|off]",
    category: "Development",
  },
  export: {
    description: "Export current project",
    usage: "export [format]",
    category: "Development",
  },
  import: {
    description: "Import code file",
    usage: "import <file_path>",
    category: "Development",
  },
}

// Added DesktopWindow component for draggable/resizable windows
const DesktopWindow: React.FC<{
  window: WindowState
  onDragStart: (e: React.MouseEvent, windowId: string) => void
  onResizeStart: (e: React.MouseEvent, windowId: string) => void
  onClose: (windowId: string) => void
  onMinimize: (windowId: string) => void
  onFocus: (windowId: string) => void
  children: React.ReactNode
}> = ({ window, onDragStart, onResizeStart, onClose, onMinimize, onFocus, children }) => {
  return (
    <div
      className="absolute bg-gradient-to-br from-card to-card/90 border border-primary/30 rounded-lg shadow-2xl flex flex-col overflow-hidden"
      style={{
        left: `${window.x}px`,
        top: `${window.y}px`,
        width: `${window.width}px`,
        height: `${window.height}px`,
        zIndex: window.zIndex,
      }}
      onClick={() => onFocus(window.id)}
    >
      {/* Window header */}
      <div
        className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-primary/30 px-4 py-2 flex items-center justify-between cursor-move hover:from-primary/30 hover:to-secondary/30 transition-colors"
        onMouseDown={(e) => onDragStart(e, window.id)}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <h3 className="font-semibold text-sm text-white">{window.title}</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onMinimize(window.id)}
            className="w-6 h-6 flex items-center justify-center hover:bg-yellow-500/30 rounded transition-colors"
          >
            -
          </button>
          <button
            onClick={() => onClose(window.id)}
            className="w-6 h-6 flex items-center justify-center hover:bg-red-500/30 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Window content */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-primary/40 hover:bg-primary/60 cursor-se-resize"
        onMouseDown={(e) => onResizeStart(e, window.id)}
      ></div>
    </div>
  )
}

function detectFunctionBlocks(processes: ProcessNode[]): FunctionBlock[] {
  const blocks: FunctionBlock[] = []
  let currentBlock: Partial<FunctionBlock> | null = null

  const lineMap = new Map<string, number>()
  processes.forEach((process, index) => {
    const normalizedCommand = process.command?.toLowerCase().trim() || ""
    if (normalizedCommand && !lineMap.has(normalizedCommand)) {
      lineMap.set(normalizedCommand, index)
    }
  })

  processes.forEach((process, index) => {
    if (process.category === "function" || process.fork_type === "function_call") {
      if (currentBlock) {
        const blockAddresses = Array.from(
          { length: index - 1 - currentBlock.startAddress! + 1 },
          (_, i) => currentBlock.startAddress! + i,
        )

        const { lineComposition, originalLines, optimizedLines, duplicateReplacements } = createLineComposition(
          blockAddresses,
          processes,
          lineMap,
        )

        blocks.push({
          ...currentBlock,
          endAddress: index - 1,
          addresses: blockAddresses,
          lineComposition,
          originalLines,
          optimizedLines,
          duplicateReplacements,
          efficiency: 0, // Placeholder, needs actual calculation
        } as FunctionBlock)
      }

      currentBlock = {
        id: `func-${blocks.length + 1}`,
        name: process.command?.replace(/def |function /, "") || `Function ${blocks.length + 1}`,
        startAddress: index,
        category: process.category || "general",
        description: `Function block starting at A${index + 1}`,
      }
    }

    if (process.command?.includes("return") || process.fork_type === "merge") {
      if (currentBlock) {
        const blockAddresses = Array.from(
          { length: index - currentBlock.startAddress! + 1 },
          (_, i) => currentBlock.startAddress! + i,
        )

        const { lineComposition, originalLines, optimizedLines, duplicateReplacements } = createLineComposition(
          blockAddresses,
          processes,
          lineMap,
        )

        blocks.push({
          ...currentBlock,
          endAddress: index,
          addresses: blockAddresses,
          lineComposition,
          originalLines,
          optimizedLines,
          duplicateReplacements,
          efficiency: 0, // Placeholder, needs actual calculation
        } as FunctionBlock)
        currentBlock = null
      }
    }
  })

  if (currentBlock) {
    const blockAddresses = Array.from(
      { length: processes.length - currentBlock.startAddress! },
      (_, i) => currentBlock.startAddress! + i,
    )

    const { lineComposition, originalLines, optimizedLines, duplicateReplacements } = createLineComposition(
      blockAddresses,
      processes,
      lineMap,
    )

    blocks.push({
      ...currentBlock,
      endAddress: processes.length - 1,
      addresses: blockAddresses,
      lineComposition,
      originalLines,
      optimizedLines,
      duplicateReplacements,
      efficiency: 0, // Placeholder, needs actual calculation
    } as FunctionBlock)
  }

  return blocks
}

function createLineComposition(
  addresses: number[],
  processes: ProcessNode[],
  lineMap: Map<string, number>,
): {
  lineComposition: string[]
  originalLines: string[]
  optimizedLines: string[]
  duplicateReplacements: { [key: string]: string }
} {
  const originalLines: string[] = []
  const optimizedLines: string[] = []
  const duplicateReplacements: { [key: string]: string } = {}

  addresses.forEach((addressIndex) => {
    const process = processes[addressIndex]
    const normalizedCommand = process.command?.toLowerCase().trim() || ""
    const lineRef = `a${addressIndex + 1}`

    originalLines.push(lineRef)

    const firstOccurrence = lineMap.get(normalizedCommand)
    if (firstOccurrence !== undefined && firstOccurrence < addressIndex) {
      const originalRef = `a${firstOccurrence + 1}`
      optimizedLines.push(originalRef)
      duplicateReplacements[lineRef] = originalRef
    } else {
      optimizedLines.push(lineRef)
    }
  })

  return {
    lineComposition: optimizedLines,
    originalLines,
    optimizedLines,
    duplicateReplacements,
  }
}

function detectCodeDuplicates(processes: ProcessNode[]): ProcessNode[] {
  const codeMap = new Map<string, ProcessNode[]>()
  const uniqueProcesses: ProcessNode[] = []

  processes.forEach((process) => {
    const normalizedCommand = process.command?.toLowerCase().trim() || ""
    if (!codeMap.has(normalizedCommand)) {
      codeMap.set(normalizedCommand, [])
    }
    codeMap.get(normalizedCommand)!.push(process)
  })

  codeMap.forEach((duplicates, command) => {
    if (duplicates.length > 1) {
      const primary = duplicates[0]
      uniqueProcesses.push({
        ...primary,
        isDuplicate: false,
        duplicateCount: duplicates.length,
        references: duplicates.slice(1).map((d) => d.index),
      })

      duplicates.slice(1).forEach((duplicate) => {
        uniqueProcesses.push({
          ...duplicate,
          isDuplicate: true,
          referenceTo: primary.index,
          command: `→ REF A${primary.index + 1}: ${command}`,
        })
      })
    } else {
      uniqueProcesses.push({
        ...duplicates[0],
        isDuplicate: false,
      })
    }
  })

  return uniqueProcesses.sort((a, b) => a.index - b.index)
}

interface DNASpiralProps {
  nodes: ProcessNode[]
  forkSpirals: ForkSpiral[]
  selectedNode: ProcessNode | null
  onNodeClick: (node: ProcessNode) => void
  onAddressClick: (node: ProcessNode, index: number) => void
  setSelectedFunctionCode: (data: any) => void
  setShowCodeModal: (show: boolean) => void
  animationState?: AnimationState
}

const DNASpiral: React.FC<DNASpiralProps> = ({
  nodes,
  selectedNode,
  onNodeClick,
  setSelectedFunctionCode,
  setShowCodeModal,
  animationState,
}) => {
  const handleNodeClick = (node: ProcessNode) => {
    onNodeClick(node)
    if (node.code && node.functionName) {
      setSelectedFunctionCode({
        name: node.functionName,
        code: node.code,
        address: node.address,
        lines: node.lines || [],
      })
      setShowCodeModal(true)
    }
  }

  const strand1: [number, number, number][] = []
  const strand2: [number, number, number][] = []
  const basePairs: Array<[[number, number, number], [number, number, number]]> = []

  nodes.forEach((node, i) => {
    const t = i / Math.max(nodes.length - 1, 1)
    const angle1 = t * Math.PI * 8 // Main strand
    const angle2 = angle1 + Math.PI // Opposite strand (180° offset)
    const radius = 8
    const height = t * 60 - 30

    const x1 = Math.cos(angle1) * radius
    const z1 = Math.sin(angle1) * radius
    const x2 = Math.cos(angle2) * radius
    const z2 = Math.sin(angle2) * radius

    strand1.push([x1, height, z1])
    strand2.push([x2, height, z2])
    basePairs.push([
      [x1, height, z1],
      [x2, height, z2],
    ])
  })

  return (
    <Canvas camera={{ position: [0, 0, 50], fov: 60 }} className="w-full h-full">
      <PerspectiveCamera makeDefault position={[0, 0, 50]} />
      <OrbitControls enableDamping dampingFactor={0.05} />

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#39FF14" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00FF00" />

      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={strand1.length}
            array={new Float32Array(strand1.flat())}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00FF00" linewidth={3} />
      </line>

      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={strand2.length}
            array={new Float32Array(strand2.flat())}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#39FF14" linewidth={3} />
      </line>

      {basePairs.map((pair, idx) => (
        <line key={`basepair-${idx}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([...pair[0], ...pair[1]])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#7FFF00" linewidth={1} opacity={0.4} transparent />
        </line>
      ))}

      {nodes.map((node, idx) => {
        const isActive = animationState?.activeAddresses.includes(node.address || "")
        const isPulsing = animationState?.pulsingNodes.includes(node.address || "")
        const position = idx % 2 === 0 ? strand1[Math.floor(idx / 2)] : strand2[Math.floor(idx / 2)]

        if (!position) return null

        return (
          <group key={`node-${idx}`} position={position}>
            <mesh onClick={() => handleNodeClick(node)}>
              <sphereGeometry args={[isPulsing ? 0.6 : 0.4, 32, 32]} />
              <meshStandardMaterial
                color={isActive ? "#39FF14" : node === selectedNode ? "#00FF00" : "#7FFF00"}
                emissive={isActive ? "#ADFF2F" : node === selectedNode ? "#39FF14" : "#00FF00"}
                emissiveIntensity={isActive ? 1.2 : 0.6}
              />
            </mesh>
            <Html position={[0, 0.8, 0]} center>
              <div className="text-xs text-green-400 font-bold whitespace-nowrap pointer-events-none drop-shadow-lg">
                {node.functionName || node.address}
              </div>
            </Html>
          </group>
        )
      })}

      {animationState?.flowingData.map((flow, idx) => (
        <mesh key={`flow-${idx}`} position={[0, -30 + flow.progress * 20, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#39FF14" emissive="#39FF14" emissiveIntensity={2} />
        </mesh>
      ))}
    </Canvas>
  )
}

interface BirdsEyeViewProps {
  nodes: ProcessNode[]
  selectedNode: ProcessNode | null
  onNodeClick: (node: ProcessNode) => void
  expandedBlocks?: string[]
  runningBlock?: FunctionBlock | null
  executingProcess?: ProcessNode | null
  functionBlocks?: FunctionBlock[]
  setSelectedFunctionCode: (data: any) => void
  setShowCodeModal: (show: boolean) => void
}

const BirdsEyeView: React.FC<BirdsEyeViewProps> = ({
  nodes,
  selectedNode,
  onNodeClick,
  setSelectedFunctionCode,
  setShowCodeModal,
  expandedBlocks,
  runningBlock,
}) => {
  if (!nodes || nodes.length === 0) return null

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-black via-gray-950 to-black cyber-grid overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 800 600">
        <defs>
          <radialGradient id="spiralDisk" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#00FF00" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#7FFF00" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Central disk */}
        <circle cx="400" cy="300" r="200" fill="url(#spiralDisk)" filter="url(#glow)" />

        {/* Spiral disk rings */}
        {[1, 2, 3, 4, 5].map((ring) => (
          <circle
            key={`ring-${ring}`}
            cx="400"
            cy="300"
            r={ring * 40}
            fill="none"
            stroke="#7FFF00"
            strokeWidth="0.5"
            opacity={0.3}
          />
        ))}

        {/* Nodes positioned in spiral disk */}
        {nodes.map((node, idx) => {
          const totalNodes = nodes.length
          const angle = (idx / Math.max(totalNodes, 1)) * Math.PI * 6 // Multiple rotations
          const radius = 40 + (idx / Math.max(totalNodes, 1)) * 160
          const x = 400 + Math.cos(angle) * radius
          const y = 300 + Math.sin(angle) * radius

          return (
            <g key={`2d-node-${idx}`}>
              {/* Connection line to center */}
              <line x1={x} y1={y} x2="400" y2="300" stroke="#7FFF00" strokeWidth="0.5" opacity="0.2" />

              {/* Node with glow */}
              <circle
                cx={x}
                cy={y}
                r="6"
                fill={node === selectedNode ? "#39FF14" : "#00FF00"}
                opacity="0.9"
                filter="url(#glow)"
                onClick={() => {
                  onNodeClick(node)
                  if (node.code && node.functionName) {
                    setSelectedFunctionCode({
                      name: node.functionName,
                      code: node.code,
                      address: node.address,
                    })
                    setShowCodeModal(true)
                  }
                }}
                className="cursor-pointer hover:opacity-100 transition-opacity"
              />

              {/* Label */}
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                className="text-xs fill-green-400 font-bold pointer-events-none"
                fontSize="10"
              >
                {node.address}
              </text>
            </g>
          )
        })}

        {/* Center point */}
        <circle cx="400" cy="300" r="8" fill="#00FF00" opacity="0.6" filter="url(#glow)" />
      </svg>
    </div>
  )
}

interface FunctionCodeModalProps {
  isOpen: boolean
  onClose: () => void
  functionData: any
}

const FunctionCodeModal: React.FC<FunctionCodeModalProps> = ({ isOpen, onClose, functionData }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-card to-card/90 border border-primary/30 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-primary">{functionData?.name}</h2>
            <p className="text-sm text-muted-foreground">Address: {functionData?.address}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors">
            ✕
          </button>
        </div>
        <pre className="bg-black/50 p-4 rounded border border-primary/20 text-sm text-primary font-mono overflow-auto">
          {functionData?.code}
        </pre>
      </div>
    </div>
  )
}

// Moved state declarations here as they were outside the component scope in the updates.
export default function Page() {
  const [isMounted, setIsMounted] = useState(false)
  const [showFileTree, setShowFileTree] = useState(false)
  const [showScriptConverter, setShowScriptConverter] = useState(false)
  const [scriptInput, setScriptInput] = useState("")
  const [convertedOutput, setConvertedOutput] = useState("")

  const [showFileLoader, setShowFileLoader] = useState(false)
  const [activeView, setActiveView] = useState("3d")
  const [dragActive, setDragActive] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [projectAnalysis, setProjectAnalysis] = useState<ProjectAnalysis | null>(null)
  const [loadedFiles, setLoadedFiles] = useState<File[]>([])
  const [spiralNodes, setSpiralNodes] = useState<ProcessNode[]>([])
  const [functionBlocks, setFunctionBlocks] = useState<FunctionBlock[]>([])
  const [forkSpirals, setForkSpirals] = useState<ForkSpiral[]>([])
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null)
  const [addressRegistry, setAddressRegistry] = useState<AddressRegistry>({})
  const [pipelineCalls, setPipelineCalls] = useState<PipelineCall[]>([])
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput[]>([])
  const [terminalInput, setTerminalInput] = useState("")
  const [functionLibrary, setFunctionLibrary] = useState<LibraryFunction[]>([])
  const [currentProject, setCurrentProject] = useState<DeveloperProject | null>(null)
  const [projects, setProjects] = useState<DeveloperProject[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [activeWindowIndex, setActiveWindowIndex] = useState(0)
  const [windows, setWindows] = useState<WindowState[]>([])
  const [conversions, setConversions] = useState<DNAToFileConversion[]>([])
  const [transmissions, setTransmissions] = useState<FileTransmissionRecord[]>([])
  const [selectedFunctionCode, setSelectedFunctionCode] = useState<any>(null)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [animationState, setAnimationState] = useState<AnimationState>({
    activeAddresses: [],
    flowingData: [],
    pulsingNodes: [],
  })
  const [libraryView, setLibraryView] = useState<"list" | "pulldown">("list")
  const [librarySortBy, setLibrarySortBy] = useState<"alphabetic" | "project">("project")
  const [expandedBlocks, setExpandedBlocks] = useState<string[]>([])
  const [runningBlock, setRunningBlock] = useState<FunctionBlock | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [genomeTree, setGenomeTree] = useState<GenomeNode[]>([])
  const [aiAgents, setAIAgents] = useState<AIAgent[]>([])
  const [showGenomeView, setShowGenomeView] = useState(false)
  const [selectedGenome, setSelectedGenome] = useState<GenomeNode | null>(null)
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiChatMessages, setAIChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [aiChatInput, setAIChatInput] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setLoadedFiles(files)
    addTerminalOutput(`Loaded ${files.length} files`, "system")

    try {
      const allNodesArrays = await Promise.all(files.map((file) => importFileAsDNA(file)))
      const allNodes = allNodesArrays.flat()
      setSpiralNodes(allNodes)
      const blocks = detectFunctionBlocks(allNodes)
      setFunctionBlocks(blocks)
      buildAddressRegistry(allNodes)
      addTerminalOutput(`Processed ${allNodes.length} code addresses from ${files.length} files`, "system")
    } catch (error: any) {
      addTerminalOutput(`Error processing files: ${error.message}`, "error")
    }
  }

  const addFunctionToBuild = (func: any) => {
    // Create new address nodes for this function
    const newNodes = func.addresses.map((addr: string, idx: number) => ({
      id: `${spiralNodes.length + idx + 1}`,
      address: addr,
      content: func.code || `function ${func.name}() { /* ${addr} */ }`,
      functionName: func.name,
      projectName: currentProject || "Current Build",
    }))

    setSpiralNodes([...spiralNodes, ...newNodes])
    const updatedBlocks = detectFunctionBlocks([...spiralNodes, ...newNodes])
    setFunctionBlocks(updatedBlocks)
    buildAddressRegistry([...spiralNodes, ...newNodes])

    addTerminalOutput(`Added function "${func.name}" to build (${func.addresses.length} addresses)`, "system")
  }

  const convertScriptToLibrary = (script: string) => {
    const lines = script.split("\n")
    const functions: LibraryFunction[] = []
    let currentFunction = ""
    let functionName = ""

    lines.forEach((line) => {
      const functionMatch = line.match(/function\s+(\w+)/)
      if (functionMatch) {
        if (currentFunction && functionName) {
          functions.push({
            id: `lib-${Date.now()}-${Math.random()}`,
            name: functionName,
            dnaAddress: `LIB${functions.length + 1}`, // Use dnaAddress for library functions
            code: currentFunction.trim(),
            parameters: [], // Placeholder
            returnType: "any", // Placeholder
            category: "converted",
            tags: [], // Placeholder
            usageCount: 0,
            dateCreated: new Date().toISOString(),
            author: "CodeMap",
            project: currentProject?.name || "default",
          })
        }
        functionName = functionMatch[1]
        currentFunction = line + "\n"
      } else {
        currentFunction += line + "\n"
      }
    })

    // Add the last function if it exists
    if (currentFunction && functionName) {
      functions.push({
        id: `lib-${Date.now()}-${Math.random()}`,
        name: functionName,
        dnaAddress: `LIB${functions.length + 1}`,
        code: currentFunction.trim(),
        parameters: [],
        returnType: "any",
        category: "converted",
        tags: [],
        usageCount: 0,
        dateCreated: new Date().toISOString(),
        author: "CodeMap",
        project: currentProject?.name || "default",
      })
    }

    setFunctionLibrary((prev) => [...prev, ...functions])
    addTerminalOutput(`Converted ${functions.length} functions to library`, "system")
    return functions
  }

  const convertLibraryToScript = (libraryFunctions: LibraryFunction[]) => {
    const script = libraryFunctions.map((fn) => fn.code).join("\n\n")
    setConvertedOutput(script)
    addTerminalOutput(`Generated script from ${libraryFunctions.length} library functions`, "system")
    return script
  }

  const generateHierarchicalAddress = (
    programName: string,
    functionName: string,
    orderInProgram: number,
    globalIndex: number,
    existingAddresses: Set<string>,
  ): HierarchicalAddress => {
    // Get first letter of program name, find next available if taken
    let programLetter = programName.charAt(0).toUpperCase()
    let letterIndex = 0
    while (existingAddresses.has(programLetter) && letterIndex < programName.length) {
      letterIndex++
      programLetter = programName.charAt(letterIndex).toUpperCase()
    }

    // Get first letter of function/category name
    const functionLetter = functionName.charAt(0).toLowerCase()

    const fullAddress = `${programLetter}.${functionLetter}.${orderInProgram}.${globalIndex}`
    return {
      program: programLetter,
      function: functionLetter,
      order: orderInProgram,
      global: globalIndex,
      fullAddress,
    }
  }

  const createGenomeNode = (
    func: LibraryFunction,
    programName: string,
    orderInProgram: number,
    globalIndex: number,
    existingAddresses: Set<string>,
  ): GenomeNode => {
    const address = generateHierarchicalAddress(programName, func.name, orderInProgram, globalIndex, existingAddresses)

    return {
      id: `genome-${globalIndex}`,
      name: func.name,
      hierarchicalAddress: address.fullAddress,
      traits: func.tags || [],
      spawnPoint: func.category === "core" || func.usageCount > 10,
      parentGenome: undefined,
      childGenomes: [],
      priority: func.usageCount,
      workflow: [func.description],
      functionalProcesses: [func.code],
      dnaAddress: func.dnaAddress,
      category: func.category,
    }
  }

  const buildGenomeTree = () => {
    const tree: GenomeNode[] = []
    const addressSet = new Set<string>()
    let globalIndex = 1

    // Group functions by project (program)
    const projectGroups = functionLibrary.reduce(
      (acc, func) => {
        const project = func.project || "default"
        if (!acc[project]) acc[project] = []
        acc[project].push(func)
        return acc
      },
      {} as { [key: string]: LibraryFunction[] },
    )

    // Create genome nodes for each function
    Object.entries(projectGroups).forEach(([projectName, functions]) => {
      functions.forEach((func, orderIndex) => {
        const genomeNode = createGenomeNode(func, projectName, orderIndex + 1, globalIndex, addressSet)
        addressSet.add(genomeNode.hierarchicalAddress)
        tree.push(genomeNode)
        globalIndex++
      })
    })

    // Establish parent-child relationships based on dependencies
    tree.forEach((node) => {
      const relatedNodes = tree.filter((n) => n.traits.some((trait) => node.traits.includes(trait)) && n.id !== node.id)
      node.childGenomes = relatedNodes.map((n) => n.id)
      relatedNodes.forEach((related) => {
        if (!related.parentGenome) related.parentGenome = node.id
      })
    })

    setGenomeTree(tree)
    addTerminalOutput(`Built genome tree with ${tree.length} nodes`, "system")
    return tree
  }

  const spawnAIAgent = (spawnGenome: GenomeNode, purpose: string): AIAgent => {
    // Collect inherited traits from parent genome lineage
    const inheritedTraits: string[] = [...spawnGenome.traits]
    let currentGenome: GenomeNode | undefined = spawnGenome

    while (currentGenome?.parentGenome) {
      const parent = genomeTree.find((g) => g.id === currentGenome!.parentGenome)
      if (parent) {
        inheritedTraits.push(...parent.traits.filter((t) => !inheritedTraits.includes(t)))
        currentGenome = parent
      } else {
        break
      }
    }

    // Build address library from genome tree
    const addressLibrary: { [key: string]: string } = {}
    genomeTree.forEach((genome) => {
      addressLibrary[genome.hierarchicalAddress] = genome.name
    })

    const agent: AIAgent = {
      id: `agent-${Date.now()}`,
      name: `${spawnGenome.name}Agent`,
      spawnPoint: spawnGenome,
      inheritedTraits,
      purpose,
      priorities: spawnGenome.workflow,
      workflows: spawnGenome.functionalProcesses,
      activeGenomes: [spawnGenome.id, ...spawnGenome.childGenomes],
      addressLibrary,
    }

    setAIAgents((prev) => [...prev, agent])
    addTerminalOutput(`Spawned AI agent "${agent.name}" from genome ${spawnGenome.hierarchicalAddress}`, "system")
    return agent
  }

  const aiDecisionMaking = async (agent: AIAgent, query: string): Promise<string> => {
    addTerminalOutput(`AI Agent "${agent.name}" processing query...`, "system")

    // Find relevant genome nodes based on query
    const relevantGenomes = genomeTree.filter(
      (genome) =>
        genome.traits.some((trait) => query.toLowerCase().includes(trait.toLowerCase())) ||
        genome.name.toLowerCase().includes(query.toLowerCase()),
    )

    if (relevantGenomes.length === 0) {
      return "No relevant functions found in genome library."
    }

    // Build execution plan using hierarchical addresses
    const executionPlan = relevantGenomes
      .map((genome) => ({
        address: genome.hierarchicalAddress,
        function: genome.name,
        priority: genome.priority,
      }))
      .sort((a, b) => b.priority - a.priority)

    // Simulate AI calling functions by address
    addTerminalOutput(`AI executing plan with ${executionPlan.length} functions:`, "system")
    executionPlan.forEach((step) => {
      addTerminalOutput(`  → Calling ${step.address}: ${step.function}`, "output")
    })

    return `Executed ${executionPlan.length} functions from genome library: ${executionPlan.map((s) => s.address).join(", ")}`
  }

  const handleGenomeCommands = (command: string) => {
    const lowerCommand = command.toLowerCase().trim()

    if (lowerCommand === "genome") {
      buildGenomeTree()
      setShowGenomeView(true)
      return true
    }

    if (lowerCommand.startsWith("spawn ")) {
      const genomeName = command.substring(6).trim()
      const genome = genomeTree.find((g) => g.name.toLowerCase().includes(genomeName.toLowerCase()))
      if (genome) {
        spawnAIAgent(genome, `Agent for ${genome.name}`)
      } else {
        addTerminalOutput(`Genome "${genomeName}" not found`, "error")
      }
      return true
    }

    if (lowerCommand.startsWith("ai ")) {
      const query = command.substring(3).trim()
      if (aiAgents.length === 0) {
        addTerminalOutput('No AI agents available. Use "spawn <genome>" to create one.', "error")
      } else {
        aiDecisionMaking(aiAgents[0], query)
      }
      return true
    }

    if (lowerCommand === "agents") {
      if (aiAgents.length === 0) {
        addTerminalOutput("No AI agents spawned", "output")
      } else {
        aiAgents.forEach((agent) => {
          addTerminalOutput(`Agent: ${agent.name} (Spawn: ${agent.spawnPoint.hierarchicalAddress})`, "output")
          addTerminalOutput(`  Traits: ${agent.inheritedTraits.join(", ")}`, "output")
          addTerminalOutput(`  Purpose: ${agent.purpose}`, "output")
        })
      }
      return true
    }

    return false
  }

  useEffect(() => {
    setIsMounted(true)
    generateSampleData()

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const generateSampleData = () => {
    const sampleNodes: ProcessNode[] = Array.from({ length: 20 }, (_, i) => ({
      index: i,
      coords: [0, 0, 0] as [number, number, number],
      strand: i % 2,
      base: ["A", "T", "C", "G"][i % 4],
      complement: ["T", "A", "G", "C"][i % 4],
      angle: 0,
      base_pair_id: `bp-${i}`,
      command: `function_${i + 1}()`,
      category: ["function", "data", "logic", "api"][i % 4],
      address: `a${i + 1}`,
      functionName: `Function${i + 1}`,
      code: `// Function ${i + 1} implementation\nreturn data_${i + 1}`,
      lines: [`// Function ${i + 1} implementation`, `return data_${i + 1}`], // Add lines property
    }))

    setSpiralNodes(sampleNodes)
    setFunctionBlocks(detectFunctionBlocks(sampleNodes))
    buildAddressRegistry(sampleNodes)
    setIsLoading(false) // Set loading to false after sample data is generated
  }

  const buildAddressRegistry = (nodes: ProcessNode[]) => {
    const registry: AddressRegistry = {}
    nodes.forEach((node, index) => {
      if (node.address) {
        registry[node.address] = {
          node,
          index,
          dependencies: [],
          executionFunction: async () => {
            console.log(`[v0] Executing ${node.address}: ${node.command}`)
            // Simulate some async operation
            await new Promise((resolve) => setTimeout(resolve, 50))
            addTerminalOutput(`Executed ${node.address}`, "output")
            return { success: true, result: `Executed ${node.address}` }
          },
        }
      }
    })
    setAddressRegistry(registry)
  }

  const summonAddress = async (addressId: string) => {
    const registryEntry = addressRegistry[addressId]
    if (!registryEntry) {
      addTerminalOutput(`Address ${addressId} not found in registry`, "error")
      return
    }

    // Update animation state for active and pulsing nodes
    setAnimationState((prev) => ({
      ...prev,
      activeAddresses: [...prev.activeAddresses, addressId],
      pulsingNodes: [...prev.pulsingNodes, addressId],
    }))

    addTerminalOutput(`🔮 Summoning ${addressId}...`, "system")

    // Simulate execution delay and update terminal output
    setTimeout(async () => {
      try {
        addTerminalOutput(`⚡ Executing ${addressId}: ${registryEntry.node.command}`, "output")
        const result = await registryEntry.executionFunction()
        addTerminalOutput(`✅ Completed ${addressId}`, "output")

        // Update animation state after execution
        setAnimationState((prev) => ({
          activeAddresses: prev.activeAddresses.filter((a) => a !== addressId),
          pulsingNodes: prev.pulsingNodes.filter((a) => a !== addressId),
          flowingData: [], // Clear flowing data for simplicity
        }))
      } catch (error) {
        console.error(`Error executing ${addressId}:`, error)
        addTerminalOutput(`❌ Failed ${addressId}: ${error.message}`, "error")
        setAnimationState((prev) => ({
          activeAddresses: prev.activeAddresses.filter((a) => a !== addressId),
          pulsingNodes: prev.pulsingNodes.filter((a) => a !== addressId),
        }))
      }
    }, 1000) // Delay for visualization
  }

  const addTerminalOutput = (content: string, type: TerminalOutput["type"]) => {
    setTerminalOutput((prev) => [
      ...prev,
      {
        id: `term-${Date.now()}`,
        type,
        content,
        timestamp: Date.now(),
      },
    ])
  }

  const handleTerminalCommand = (command: string) => {
    addTerminalOutput(`$ ${command}`, "input")

    const lowerCommand = command.toLowerCase().trim()

    if (handleGenomeCommands(command)) {
      return
    }

    // Handle address execution (a1, a2, etc.)
    if (lowerCommand.match(/^a\d+$/)) {
      summonAddress(lowerCommand)
      return
    }

    if (lowerCommand.match(/^[a-z]\.[a-z]\.\d+\.\d+$/)) {
      const genome = genomeTree.find((g) => g.hierarchicalAddress.toLowerCase() === lowerCommand)
      if (genome) {
        addTerminalOutput(`Executing genome function: ${genome.name}`, "output")
        summonAddress(genome.dnaAddress)
      } else {
        addTerminalOutput(`Hierarchical address ${lowerCommand} not found`, "error")
      }
      return
    }

    // Handle run command
    if (lowerCommand.startsWith("run ")) {
      const address = lowerCommand.replace("run ", "").trim()
      summonAddress(address)
      return
    }

    // Handle summon command
    if (lowerCommand.startsWith("summon ")) {
      const address = lowerCommand.replace("summon ", "").trim()
      summonAddress(address)
      return
    }

    // Handle help command
    if (lowerCommand === "help") {
      Object.entries(COMMAND_LIBRARY).forEach(([cmd, info]) => {
        addTerminalOutput(`${cmd}: ${info.description}`, "output")
      })
      return
    }

    // Handle clear command
    if (lowerCommand === "clear") {
      setTerminalOutput([])
      return
    }

    addTerminalOutput(`Unknown command: ${command}. Type 'help' for available commands.`, "error")
  }

  if (!isMounted || isLoading) {
    // Added isLoading check
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#39FF14] text-xl glow-text">Loading CodeMap...</div>
      </div>
    )
  }

  // Group functions by project for the library view
  const groupedFunctions = functionLibrary.reduce(
    (acc, func) => {
      const projectName = func.project || "Unassigned"
      if (!acc[projectName]) {
        acc[projectName] = []
      }
      acc[projectName].push(func)
      return acc
    },
    {} as { [key: string]: LibraryFunction[] },
  )

  return (
    <div className="min-h-screen bg-black text-[#39FF14] flex flex-col">
      {/* Main IDE Container */}
      <header className="h-14 border-b border-[#C0C0C0] bg-black flex items-center px-4 gap-4">
        <h1 className="text-2xl font-bold text-[#39FF14] glow-text">CodeMap IDE</h1>
        <button
          onClick={() => setShowFileLoader(!showFileLoader)}
          className="px-4 py-2 bg-black border border-[#C0C0C0] text-[#39FF14] rounded hover:bg-[#1a1a1a] transition-colors glow-text"
        >
          Load Files
        </button>
        <button
          onClick={() => setShowFileTree(!showFileTree)}
          className="px-4 py-2 bg-black border border-[#C0C0C0] text-[#39FF14] rounded hover:bg-[#1a1a1a] transition-colors glow-text"
        >
          File Tree
        </button>
        <button
          onClick={() => setShowScriptConverter(!showScriptConverter)}
          className="px-4 py-2 bg-black border border-[#C0C0C0] text-[#39FF14] rounded hover:bg-[#1a1a1a] transition-colors glow-text"
        >
          Script Converter
        </button>
        {projectAnalysis && (
          <div className="ml-auto flex items-center gap-2 px-4 py-2 border border-[#39FF14] rounded bg-black">
            <span className="text-[#00FF00] glow-text">⚡ Energy Saved:</span>
            <span className="text-[#39FF14] font-bold">{projectAnalysis.overallEnergySavings.toFixed(2)}%</span>
            <span className="text-[#C0C0C0] text-sm">({projectAnalysis.totalDuplicates} duplicates removed)</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("3d")}
            className={`px-4 py-2 rounded border transition-colors ${activeView === "3d" ? "bg-[#39FF14] text-black border-[#39FF14]" : "bg-black border-[#C0C0C0] text-[#39FF14] hover:border-[#39FF14]"}`}
          >
            3D View
          </button>
          <button
            onClick={() => setActiveView("2d")}
            className={`px-4 py-2 rounded border transition-colors ${activeView === "2d" ? "bg-[#39FF14] text-black border-[#39FF14]" : "bg-black border-[#C0C0C0] text-[#39FF14] hover:border-[#39FF14]"}`}
          >
            2D View
          </button>
        </div>
        <button
          onClick={() => {
            buildGenomeTree()
            setShowGenomeView(!showGenomeView)
          }}
          className="px-4 py-2 bg-black border border-[#39FF14] text-[#39FF14] rounded hover:bg-[#1a1a1a] transition-colors glow-text"
        >
          🧬 Genome Tree
        </button>
        <button
          onClick={() => setShowAIChat(!showAIChat)}
          className="px-4 py-2 bg-black border border-[#00FF00] text-[#00FF00] rounded hover:bg-[#1a1a1a] transition-colors glow-text"
        >
          🤖 AI Agent
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Function Library */}
        <aside className="w-80 border-r border-[#C0C0C0] bg-black flex flex-col overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#39FF14] glow-text">Function Library</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setLibraryView(libraryView === "list" ? "pulldown" : "list")}
                  className="text-xs px-2 py-1 border border-[#C0C0C0] rounded text-[#00FF00] hover:bg-[#1a1a1a]"
                >
                  {libraryView === "list" ? "List" : "Pulldown"}
                </button>
                <button
                  onClick={() => setLibrarySortBy(librarySortBy === "alphabetic" ? "project" : "alphabetic")}
                  className="text-xs px-2 py-1 border border-[#C0C0C0] rounded text-[#00FF00] hover:bg-[#1a1a1a]"
                >
                  {librarySortBy === "alphabetic" ? "A-Z" : "Project"}
                </button>
              </div>
            </div>

            {/* Conditionally render based on libraryView */}
            {libraryView === "list" ? (
              <div className="space-y-2">
                {functionBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="p-3 border border-[#C0C0C0] rounded bg-black hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                    onClick={() => {
                      setExpandedBlocks((prev) =>
                        prev.includes(block.id) ? prev.filter((id) => id !== block.id) : [...prev, block.id],
                      )
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-[#00FF00] glow-text">{block.name}</div>
                        <div className="text-sm text-[#39FF14]">{block.id}</div>
                        <div className="text-xs text-[#C0C0C0] mt-1">Addresses: {block.addresses.length}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setRunningBlock(block)
                          addTerminalOutput(
                            `Running ${block.name} (${block.startAddress}-${block.endAddress})`,
                            "system",
                          )
                          // You might want to trigger the execution of the first address of the block here
                          if (block.addresses.length > 0) {
                            summonAddress(`a${block.addresses[0] + 1}`) // Assuming addresses are 1-based
                          }
                        }}
                        className="px-2 py-1 text-xs bg-[#39FF14] text-black rounded hover:bg-[#00FF00] transition-colors"
                      >
                        Run From Here
                      </button>
                    </div>

                    {expandedBlocks.includes(block.id) && (
                      <div className="mt-2 pt-2 border-t border-[#C0C0C0]/30">
                        <div className="text-xs space-y-1">
                          {block.lineComposition.map((line, idx) => (
                            <div key={idx} className="text-[#7FFF00]">
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div> // Pulldown view
            ) : (
              <div className="space-y-2">
                {Object.entries(groupedFunctions).map(([projectName, functions]) => (
                  <div key={projectName} className="space-y-2">
                    <div className="text-[#00FF00] font-bold text-sm border-b border-[#C0C0C0]/30 pb-1">
                      {projectName}
                    </div>
                    {functions.map((func, idx) => (
                      <div
                        key={idx}
                        className="border border-[#C0C0C0]/50 rounded p-2 hover:border-[#39FF14] transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-[#39FF14]">{func.name}</div>
                          <button
                            onClick={() => addFunctionToBuild(func)}
                            className="px-2 py-1 text-xs bg-black border border-[#39FF14] text-[#39FF14] rounded hover:bg-[#39FF14] hover:text-black transition-colors opacity-0 group-hover:opacity-100"
                            title="Add to build"
                          >
                            + Add
                          </button>
                        </div>
                        <div className="text-xs text-[#C0C0C0] mt-1">{func.addresses.join(", ")}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center - DNA Visualization */}
        <main className="flex-1 bg-black relative">
          {activeView === "3d" ? (
            <DNASpiral
              nodes={spiralNodes}
              forkSpirals={forkSpirals}
              selectedNode={selectedNode}
              onNodeClick={setSelectedNode}
              onAddressClick={(node, index) => {}}
              setSelectedFunctionCode={setSelectedFunctionCode}
              setShowCodeModal={setShowCodeModal}
              animationState={animationState}
            />
          ) : (
            <BirdsEyeView
              nodes={spiralNodes}
              functionBlocks={functionBlocks}
              selectedNode={selectedNode}
              onNodeClick={setSelectedNode}
              setSelectedFunctionCode={setSelectedFunctionCode}
              setShowCodeModal={setShowCodeModal}
              expandedBlocks={expandedBlocks}
              runningBlock={runningBlock}
            />
          )}
        </main>

        {/* Right Sidebar - Terminal */}
        <aside className="w-96 border-l border-[#C0C0C0] bg-black flex flex-col">
          <div className="p-4 border-b border-[#C0C0C0]">
            <h2 className="text-xl font-bold text-[#39FF14] glow-text">Terminal</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1">
            <div className="text-[#00FF00] glow-text">
              CodeMap Terminal v1.0
              <br />
              Type 'help' for available commands
              <br />
              <br />
            </div>
            {terminalOutput.map((output) => (
              <div
                key={output.id}
                className={`${
                  output.type === "error"
                    ? "text-red-400"
                    : output.type === "system"
                      ? "text-[#7FFF00]"
                      : output.type === "input"
                        ? "text-[#00FF00]"
                        : "text-[#39FF14]"
                }`}
              >
                {output.content}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-[#C0C0C0]">
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTerminalCommand(terminalInput)
                  setTerminalInput("")
                }
              }}
              placeholder="Enter command..."
              className="w-full bg-black border border-[#C0C0C0] rounded px-3 py-2 text-[#39FF14] font-mono text-sm focus:outline-none focus:border-[#39FF14]"
            />
          </div>
        </aside>
      </div>

      {/* File Loader Modal */}
      {showFileLoader && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border-2 border-[#C0C0C0] rounded-lg p-6 max-w-2xl w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-[#39FF14] glow-text">Load Project Files</h2>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.zip"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={async (e) => {
                e.preventDefault()
                setDragActive(false)
                const files = Array.from(e.dataTransfer.files)
                setLoadedFiles(files)
                addTerminalOutput(`Loaded ${files.length} files`, "system")

                try {
                  const allNodesArrays = await Promise.all(files.map((file) => importFileAsDNA(file)))
                  const allNodes = allNodesArrays.flat()
                  setSpiralNodes(allNodes)
                  const blocks = detectFunctionBlocks(allNodes)
                  setFunctionBlocks(blocks)
                  buildAddressRegistry(allNodes)
                  addTerminalOutput(`Processed ${allNodes.length} code addresses from ${files.length} files`, "system")
                } catch (error: any) {
                  addTerminalOutput(`Error processing files: ${error.message}`, "error")
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                dragActive ? "border-[#39FF14] bg-[#1a1a1a]" : "border-[#C0C0C0]"
              }`}
            >
              <p className="text-[#39FF14] text-lg glow-text">Drag and drop files here or click to browse</p>
              <p className="text-[#C0C0C0] text-sm mt-2">Supports .js, .ts, .py, .zip and more</p>
            </div>

            {loadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-[#00FF00] font-bold">Loaded Files:</h3>
                {loadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-[#39FF14] flex justify-between items-center border border-[#C0C0C0]/30 rounded px-3 py-2"
                  >
                    <span>{file.name}</span>
                    <span className="text-[#C0C0C0]">{(file.size / 1024).toFixed(2)} KB</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowFileLoader(false)}
                className="px-4 py-2 bg-black border border-[#C0C0C0] text-[#39FF14] rounded hover:bg-[#1a1a1a] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showFileTree && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border-2 border-[#C0C0C0] rounded-lg p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#39FF14] glow-text">File Tree View</h2>
              <button onClick={() => setShowFileTree(false)} className="text-[#C0C0C0] hover:text-[#39FF14] text-2xl">
                ✕
              </button>
            </div>
            <div className="space-y-2 font-mono text-sm">
              {loadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[#39FF14] border-b border-[#C0C0C0]/20 pb-2">
                  <span className="text-[#00FF00]">📄</span>
                  <span>{file.name}</span>
                  <span className="text-[#C0C0C0] text-xs ml-auto">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              ))}
              {loadedFiles.length === 0 && <p className="text-[#C0C0C0] text-center py-8">No files loaded yet</p>}
            </div>
          </div>
        </div>
      )}

      {showScriptConverter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border-2 border-[#C0C0C0] rounded-lg p-6 max-w-4xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#39FF14] glow-text">Script ⇄ Library Converter</h2>
              <button
                onClick={() => setShowScriptConverter(false)}
                className="text-[#C0C0C0] hover:text-[#39FF14] text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Script to Library */}
              <div>
                <h3 className="text-[#00FF00] font-bold mb-2">Script → Library</h3>
                <textarea
                  value={scriptInput}
                  onChange={(e) => setScriptInput(e.target.value)}
                  placeholder="Paste your script here..."
                  className="w-full h-64 bg-black border border-[#C0C0C0] rounded p-3 text-[#39FF14] font-mono text-sm focus:outline-none focus:border-[#39FF14]"
                />
                <button
                  onClick={() => convertScriptToLibrary(scriptInput)}
                  className="mt-2 px-4 py-2 bg-[#39FF14] text-black rounded hover:bg-[#00FF00] transition-colors font-bold w-full"
                >
                  Convert to Library
                </button>
              </div>

              {/* Library to Script */}
              <div>
                <h3 className="text-[#00FF00] font-bold mb-2">Library → Script</h3>
                <textarea
                  value={convertedOutput}
                  readOnly
                  placeholder="Converted script will appear here..."
                  className="w-full h-64 bg-black border border-[#C0C0C0] rounded p-3 text-[#39FF14] font-mono text-sm focus:outline-none"
                />
                <button
                  onClick={() => {
                    const output = convertLibraryToScript(functionLibrary)
                    navigator.clipboard.writeText(output)
                    addTerminalOutput("Script copied to clipboard", "system")
                  }}
                  className="mt-2 px-4 py-2 bg-[#39FF14] text-black rounded hover:bg-[#00FF00] transition-colors font-bold w-full"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Function Code Modal */}
      <FunctionCodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        functionData={selectedFunctionCode}
      />

      {showGenomeView && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-black border-2 border-[#39FF14] rounded-lg p-6 max-w-6xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#39FF14] glow-text">🧬 Genome Tree Architecture</h2>
              <button onClick={() => setShowGenomeView(false)} className="text-[#C0C0C0] hover:text-[#39FF14] text-2xl">
                ✕
              </button>
            </div>

            <div className="mb-4 text-[#00FF00] space-y-2">
              <p>
                Hierarchical Address Format: <span className="text-[#39FF14] font-mono">P.F.O.G</span>
              </p>
              <p className="text-sm text-[#C0C0C0]">
                P = Program/Repo letter, F = Function letter, O = Order in program, G = Global library index
              </p>
              <p>
                Total Genomes: <span className="text-[#39FF14]">{genomeTree.length}</span>
              </p>
              <p>
                AI Agents: <span className="text-[#39FF14]">{aiAgents.length}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
              {genomeTree.map((genome) => (
                <div
                  key={genome.id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    genome.spawnPoint
                      ? "border-[#00FF00] bg-[#00FF00]/10"
                      : "border-[#C0C0C0]/30 hover:border-[#39FF14]"
                  }`}
                  onClick={() => setSelectedGenome(genome)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[#39FF14] font-bold font-mono text-lg">{genome.hierarchicalAddress}</h3>
                      <p className="text-[#00FF00]">{genome.name}</p>
                      <p className="text-[#C0C0C0] text-sm">{genome.category}</p>
                    </div>
                    <div className="text-right">
                      {genome.spawnPoint && (
                        <span className="inline-block px-2 py-1 bg-[#00FF00] text-black text-xs rounded mb-2">
                          SPAWN POINT
                        </span>
                      )}
                      <p className="text-[#C0C0C0] text-sm">Priority: {genome.priority}</p>
                      <p className="text-[#C0C0C0] text-sm">Children: {genome.childGenomes.length}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {genome.traits.map((trait) => (
                      <span
                        key={trait}
                        className="px-2 py-1 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded text-xs text-[#39FF14]"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      spawnAIAgent(genome, `Agent for ${genome.name}`)
                    }}
                    className="mt-3 px-3 py-1 bg-[#00FF00] text-black rounded hover:bg-[#39FF14] transition-colors text-sm font-bold"
                  >
                    Spawn AI Agent
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAIChat && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-black border-2 border-[#00FF00] rounded-lg shadow-2xl flex flex-col z-50">
          <div className="bg-gradient-to-r from-[#00FF00]/20 to-[#39FF14]/20 border-b border-[#00FF00]/30 px-4 py-3 flex items-center justify-between">
            <h3 className="text-[#00FF00] font-bold glow-text">🤖 AI Agent Chat</h3>
            <button onClick={() => setShowAIChat(false)} className="text-[#C0C0C0] hover:text-[#00FF00]">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
            {aiChatMessages.map((msg, idx) => (
              <div key={idx} className={`${msg.role === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block max-w-[80%] px-3 py-2 rounded ${
                    msg.role === "user"
                      ? "bg-[#39FF14]/20 border border-[#39FF14]/30 text-[#39FF14]"
                      : "bg-[#00FF00]/20 border border-[#00FF00]/30 text-[#00FF00]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {aiAgents.length === 0 && (
              <p className="text-[#C0C0C0] text-center">No AI agents spawned. Create one from the Genome Tree.</p>
            )}
          </div>

          <div className="border-t border-[#00FF00]/30 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!aiChatInput.trim() || aiAgents.length === 0) return

                setAIChatMessages((prev) => [...prev, { role: "user", content: aiChatInput }])
                aiDecisionMaking(aiAgents[0], aiChatInput).then((response) => {
                  setAIChatMessages((prev) => [...prev, { role: "assistant", content: response }])
                })
                setAIChatInput("")
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={aiChatInput}
                onChange={(e) => setAIChatInput(e.target.value)}
                placeholder="Ask AI agent..."
                className="flex-1 bg-black border border-[#00FF00]/30 rounded px-3 py-2 text-[#39FF14] text-sm focus:outline-none focus:border-[#00FF00]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#00FF00] text-black rounded hover:bg-[#39FF14] transition-colors font-bold text-sm"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// InstagramAutomationFlow.tsx

'use client'

import React, { useCallback, useEffect, useState } from 'react'
import ReactFlow, { addEdge, Controls, Background, useEdgesState, useNodesState, Connection, MarkerType, Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from '@/components/ui/button'
import TriggerNode from './components/triggerNode'
import ActionNode from './components/actionNode'
import type { TriggerData, ActionData, ActionNode as CustomActionNode } from './types/nodeTypes'

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
}

export default function InstagramAutomationFlow() {
  const [triggerNode, setTriggerNode, onTriggerNodeChange] = useNodesState<TriggerData>([
    {
      id: 'trigger',
      type: 'trigger',
      position: { x: 20, y: 70 },
      data: { type: 'onComment', condition: '' },
    },
  ])

  const [actionNodes, setActionNodes, onActionNodesChange] = useNodesState<ActionData>([
    {
      id: `action-${1}`,
      type: 'action',
      position: { x: (1) * 256 + 60 + 20, y: 70 },
      data: { type: 'question', questionType: 'text', errorMessage: '' },
    }
  ])
  const [edges, setEdges, onEdgesChange] = useEdgesState([
    {
      id: `e-${actionNodes.length}-${actionNodes.length + 1}`,
      source: 'trigger',
      target: `action-${1}`,
      markerEnd: { type: MarkerType.ArrowClosed },
    }
  ])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  )

  const addActionNode = () => {
    const newNode: CustomActionNode = {
      id: `action-${actionNodes.length + 1}`,
      type: 'action',
      position: { x: (actionNodes.at(-1)!.position.x ) + 256 + 120, y: actionNodes.at(-1)!.position.y },
      data: { type: 'question', questionType: 'text', errorMessage: '' },
    }
    setActionNodes((nds) => [...nds, newNode])

    console.log(actionNodes.length === 0 ? triggerNode[0].id : actionNodes[actionNodes.length - 1].id);
    
    const newEdge: Edge = {
      id: `e-${actionNodes.length}-${actionNodes.length + 1}`,
      source: actionNodes.length === 0 ? triggerNode[0].id : actionNodes[actionNodes.length - 1].id,
      target: newNode.id,
      markerEnd: { type: MarkerType.ArrowClosed },
    }
    setEdges((eds) => [...eds, newEdge])
  }

  const allNodes = [...triggerNode, ...actionNodes]

  useEffect(() => {
    console.log(edges);
    console.log(actionNodes);
    
    
  }, [edges, actionNodes])

  return (
    <div className="h-screen w-full">
      <ReactFlow
        nodes={allNodes}
        edges={edges}
        onNodesChange={(changes) => {
          
          onTriggerNodeChange(changes.filter((change) => change.id === 'trigger'))
          onActionNodesChange(changes.filter((change) => change.id !== 'trigger'))
        }}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <Background />
      </ReactFlow>
      <div className="absolute bottom-4 left-4">
        <Button onClick={addActionNode}>Add Action</Button>
      </div>
    </div>
  )
}

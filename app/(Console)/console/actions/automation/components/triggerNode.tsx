// components/TriggerNode.tsx

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { TriggerData } from '../types/nodeTypes'
import { Handle, Position } from 'reactflow'

const TriggerNode: React.FC<{ data: TriggerData }> = ({ data }) => (
    <>
        <Card className="w-64">
            <CardHeader>
            <CardTitle>Trigger</CardTitle>
            </CardHeader>
            <CardContent>
            <RadioGroup value={data.type} className="mb-4">
                <div className="flex items-center space-x-2">
                <RadioGroupItem value="onComment" id="onComment" />
                <Label htmlFor="onComment">On Comment</Label>
                </div>
                <div className="flex items-center space-x-2">
                <RadioGroupItem value="onDirect" id="onDirect" />
                <Label htmlFor="onDirect">On Direct</Label>
                </div>
            </RadioGroup>
            <Label htmlFor="condition">Condition</Label>
            <Input id="condition" value={data.condition} className="mt-1" />
            </CardContent>
        </Card>
        <Handle type='source' position={Position.Right}/>
    </>
)

export default TriggerNode

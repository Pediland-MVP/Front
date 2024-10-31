// components/ActionNode.tsx

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ActionData } from '../types/nodeTypes'
import { Handle, Position } from 'reactflow'

const ActionNode: React.FC<{ data: ActionData }> = ({ data }) => (
    <>
        <Handle type='target' position={Position.Left} />
    <Card className="w-64">
        <CardHeader>
        <CardTitle>Action</CardTitle>
        </CardHeader>
        <CardContent>
        <Tabs defaultValue={data.type}>
            <TabsList className="mb-4">
            <TabsTrigger value="question">Question</TabsTrigger>
            <TabsTrigger value="answer">Answer</TabsTrigger>
            </TabsList>
            <TabsContent value="question">
            <div className="space-y-4">
                <div>
                <Label htmlFor="questionType">Question Type</Label>
                <Select value={data.questionType}>
                    <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="phoneNumber">Phone Number</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <div>
                <Label htmlFor="errorMessage">Error Message</Label>
                <Input id="errorMessage" value={data.errorMessage} />
                </div>
            </div>
            </TabsContent>
            <TabsContent value="answer">
            <Label htmlFor="answer">Answer</Label>
            <Input id="answer" value={data.answer} />
            </TabsContent>
        </Tabs>
        </CardContent>
    </Card>
    <Handle type='source' position={Position.Right}/>
    </>
)

export default ActionNode

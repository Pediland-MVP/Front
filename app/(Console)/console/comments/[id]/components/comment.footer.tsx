'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Send } from 'lucide-react'
import { CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { mutate } from 'swr'
import EE from '@/lib/ee'

interface FormData {
  text: string
}

const useCtrlEnterSubmit = (handleSubmit: () => void) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault()
      handleSubmit()
    }
  }
  return handleKeyDown
}

export default function CommentFooter({commentId, mutateComments}: {commentId: string, mutateComments: any}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, reset } = useForm<FormData>()

  const onSubmitForm = async (data: FormData) => {
    setIsSubmitting(true)
    setIsSubmitting(false)

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/comments/reply/${commentId}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })

    if (!response.ok) {
        const json = await response.json()
        json.message.map((m: string) => {
            toast({
                title: m,
                variant: 'destructive'
            })
        })
        return
    }

    EE.emit('reply.sent', await response.json())

    await mutateComments()

    toast({
        title: 'ثبت شد'
    })

    reset()
  }

  const handleKeyDown = useCtrlEnterSubmit(handleSubmit(onSubmitForm))

  return (
    <CardFooter className="border-t p-4">
      <form onSubmit={handleSubmit(onSubmitForm)} className="flex w-full gap-2">
        <Textarea
          {...register('text', { required: true })}
          placeholder="ریپلای..."
          className="flex-1 min-h-[60px]"
          onKeyDown={handleKeyDown}
        />
        <Button type="submit" size="icon" className="shrink-0" disabled={isSubmitting}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </CardFooter>
  )
}
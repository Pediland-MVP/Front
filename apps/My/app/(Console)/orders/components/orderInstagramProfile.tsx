import { Card, CardContent } from "@befroosh/ui"
import { Avatar, AvatarFallback, AvatarImage } from "@befroosh/ui"
import { Button } from "@befroosh/ui"
import { CheckCircle, ChatCircle } from "@phosphor-icons/react"
import Link from "next/link"
import { OrderNamespace } from "@/types/order/order.namespace"
import { useTranslations } from "next-intl"

export function OrderInstagramProfile({ lead }: { lead: OrderNamespace.GET.Orders['items'][0]['lead'] }) {
  const t = useTranslations("Orders.OrderDetails")

  return (
    <Card className="w-full max-w-xs mx-auto">
      <CardContent className="flex items-center gap-3 p-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={lead.leadInstagram.profilePicture?.url} alt={lead.leadInstagram.name ?? `${lead.contact?.firstname} ${lead.contact.lastname}`} />
          <AvatarFallback>{lead.firstname?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-semibold text-sm truncate">{lead.leadInstagram.name ?? `${lead.contact?.firstname} ${lead.contact.lastname}`}</h3>
          </div>
          <p className="text-xs text-muted-foreground truncate">@{lead.leadInstagram.username}</p>
        </div>
        <Button asChild size="sm" className="flex-shrink-0">
          <Link href={`/directs/${lead.id}`}>
            <ChatCircle className="w-4 h-4 mr-1" />
            {t('chat')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}


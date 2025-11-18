import { Button } from '../ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { cn } from '@/lib/utils'
import NoSEO from './NoSEO'

interface NoDataCardProps {
  title: string
  description: string
  buttonText: string
  onClick?: () => void
  className?: string
  shouldIndex?: boolean
}

export function NoDataCard({
  title,
  description,
  buttonText,
  onClick,
  className,
  shouldIndex = false,
}: NoDataCardProps) {
  return (
    <>
      {!shouldIndex && <NoSEO />}
      <Card className={cn('mx-auto w-[350px]', className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onClick}>{buttonText}</Button>
        </CardFooter>
      </Card>
    </>
  )
}

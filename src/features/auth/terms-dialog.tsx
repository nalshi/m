import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type TermsDialogProps = {
  triggerClassName?: string
}

export function TermsDialog({ triggerClassName }: TermsDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={triggerClassName}>
        الشروط والأحكام
      </DialogTrigger>
      <DialogContent dir='rtl'>
        <DialogHeader>
          <DialogTitle>الشروط والأحكام</DialogTitle>
          <DialogDescription>
            يرجى قراءة الشروط والأحكام قبل استخدام منصة نالش.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3 text-sm leading-7 text-muted-foreground'>
          <h3 className='font-semibold text-foreground'>
            الشرط الشامل لإخلاء المسؤولية والالتزام البرمجي (Code is Law)
          </h3>
          <p>
            يُقر ويوافق المستخدم موافقة صريحة ونهائية ومرفوعة عن الجهالة، بأن
            منصة نالش وتطبيقاتها هي أداة تقنية مستقلة تُقدّم &quot;كما هي&quot;
            و&quot;حسب توفرها&quot;.
          </p>
          <p>
            النظام البرمجي للمنصة، وبنيتها الأكوادية، والقيود المحررة داخل
            النظام، هي المرجعية القانونية والتنفيذية الوحيدة والملزمة لكافة
            الأطراف.
          </p>
          <p>
            لا تتحمل الإدارة أي مسؤولية قانونية أو مالية تجاه أي مستخدم عن أي
            تصرف غير قانوني. ويتحمل المستخدم العواقب الناتجة عن أي مخالفة. يُعد
            قبول هذا الشرط برمجياً إسقاطاً تاماً لأي حق في مقاضاة المنصة.
          </p>
        </div>
        <DialogFooter>
          <Button type='button' onClick={() => setOpen(false)}>
            فهمت وموافق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

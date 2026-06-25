'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function updateUserSettings(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Non autorisé' }
  }

  const name = formData.get('name') as string
  const homeAddress = formData.get('homeAddress') as string
  const minSalary = parseInt(formData.get('minSalary') as string, 10)
  const maxSalary = parseInt(formData.get('maxSalary') as string, 10)

  if (isNaN(minSalary) || isNaN(maxSalary)) {
    return { error: 'Salaires invalides' }
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: name || null,
        homeAddress: homeAddress || null,
        minSalary,
        maxSalary
      }
    })
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error updating settings:', error)
    return { error: 'Erreur lors de la sauvegarde des paramètres' }
  }
}

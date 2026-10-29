import { useState, type FormEvent } from 'react'
import { Field, FormError, Input, Textarea, Button } from '../../../components/ui/form'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Modal } from '../../../components/ui/Overlay'
import { useToast } from '../../../hooks/useToast'
import { adminSkillCatalogService, type SkillCategoryDTO, type SkillDTO } from '../../../services/admin/skillCatalog.service'
import { getApiErrorMessage } from '../../../services/httpClient'

export type Dialog =
  | { kind: 'category'; category: SkillCategoryDTO | null }
  | { kind: 'skill'; skill: SkillDTO | null; categoryId: number | null }

/** Create a category, or rename / describe one. */
export function CategoryDialog({
  dialog,
  onClose,
  onSaved,
}: {
  dialog: Extract<Dialog, { kind: 'category' }> | null
  onClose: () => void
  onSaved: () => void
}) {
  return (
    <Modal
      open={dialog !== null}
      onClose={onClose}
      title={dialog?.category ? 'Edit category' : 'New category'}
      subtitle={dialog?.category ? dialog.category.name : 'Skills are grouped under categories'}
    >
      {dialog && <CategoryForm key={dialog.category?.id ?? 'new'} category={dialog.category} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: SkillCategoryDTO | null
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    if (!name.trim()) {
      setNameError('Give the category a name')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const payload = { name: name.trim(), description: description.trim() || undefined }
      const saved = category
        ? await adminSkillCatalogService.updateCategory(category.id, payload)
        : await adminSkillCatalogService.createCategory(payload)
      toast.success(category ? 'Category saved' : 'Category created', saved.name)
      onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save the category.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormError message={error} />
      <Field label="Name" htmlFor="cat-name" required error={nameError}>
        <Input
          id="cat-name"
          autoFocus
          value={name}
          maxLength={100}
          placeholder="e.g. Mobile"
          onChange={(e) => {
            setName(e.target.value)
            setNameError(undefined)
          }}
        />
      </Field>
      <Field label="Description" htmlFor="cat-desc" hint="Optional. Shown to managers when they pick a category.">
        <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving}>
          {category ? 'Save category' : 'Create category'}
        </Button>
      </div>
    </form>
  )
}

/** Create a skill inside a category, or edit one. */
export function SkillDialog({
  dialog,
  categories,
  onClose,
  onSaved,
}: {
  dialog: Extract<Dialog, { kind: 'skill' }> | null
  categories: SkillCategoryDTO[]
  onClose: () => void
  onSaved: (id: number) => void
}) {
  return (
    <Modal
      open={dialog !== null}
      onClose={onClose}
      title={dialog?.skill ? 'Edit skill' : 'New skill'}
      subtitle={dialog?.skill ? dialog.skill.skillName : 'Associates pick skills from this list'}
    >
      {dialog && (
        <SkillForm
          key={dialog.skill?.id ?? `new-${dialog.categoryId}`}
          skill={dialog.skill}
          presetCategoryId={dialog.categoryId}
          categories={categories}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  )
}

function SkillForm({
  skill,
  presetCategoryId,
  categories,
  onClose,
  onSaved,
}: {
  skill: SkillDTO | null
  presetCategoryId: number | null
  categories: SkillCategoryDTO[]
  onClose: () => void
  onSaved: (id: number) => void
}) {
  const toast = useToast()
  const [name, setName] = useState(skill?.skillName ?? '')
  const [categoryId, setCategoryId] = useState(String(skill?.categoryId ?? presetCategoryId ?? ''))
  const [description, setDescription] = useState(skill?.description ?? '')
  const [errors, setErrors] = useState<{ name?: string; category?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Active categories, plus the skill's own category even if it has since been retired.
  const options = categories
    .filter((c) => c.isActive || String(c.id) === categoryId)
    .map((c) => ({ value: String(c.id), label: c.isActive ? c.name : `${c.name} (retired)` }))

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    const found: { name?: string; category?: string } = {}
    if (!name.trim()) found.name = 'Give the skill a name'
    if (!categoryId) found.category = 'Pick the category this skill belongs to'
    if (Object.keys(found).length) {
      setErrors(found)
      return
    }
    setError(null)
    setSaving(true)
    try {
      const payload = { skillName: name.trim(), categoryId: Number(categoryId), description: description.trim() || undefined }
      const saved = skill
        ? await adminSkillCatalogService.updateSkill(skill.id, payload)
        : await adminSkillCatalogService.createSkill(payload)
      toast.success(skill ? 'Skill saved' : 'Skill added', saved.skillName)
      onSaved(saved.id)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save the skill.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormError message={error} />
      <Field label="Skill name" htmlFor="skill-name" required error={errors.name}>
        <Input
          id="skill-name"
          autoFocus
          value={name}
          maxLength={100}
          placeholder="e.g. Kotlin"
          onChange={(e) => {
            setName(e.target.value)
            setErrors((x) => ({ ...x, name: undefined }))
          }}
        />
      </Field>
      <Field label="Category" htmlFor="skill-category" required error={errors.category}>
        <Dropdown
          id="skill-category"
          ariaLabel="Category"
          value={categoryId}
          placeholder="Pick a category…"
          invalid={!!errors.category}
          options={options}
          onChange={(v) => {
            setCategoryId(v)
            setErrors((x) => ({ ...x, category: undefined }))
          }}
          emptyText="No categories yet — create one first"
        />
      </Field>
      <Field label="Description" htmlFor="skill-desc" hint="Optional. Shown to associates when they pick it.">
        <Textarea id="skill-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving}>
          {skill ? 'Save skill' : 'Add skill'}
        </Button>
      </div>
    </form>
  )
}

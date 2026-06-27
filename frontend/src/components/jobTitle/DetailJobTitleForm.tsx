import { useState, useEffect, useRef } from 'react'
import type {
    AddJobTitlePayload,
    JobTitle,
    UpdateJobTitlePayload,
} from '../../types/jobTitle'
import { useJobTitleStore } from '../../store/jobTitleStore'
import { Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import {
    useCreateJobTitle,
    useDeleteJobTitle,
    useUpdateJobTitle,
} from '../../hooks/useJobTitles'
import JobTitleInfoFields from './JobTitleInfoFields'
import ConfirmDialog from '../ui/ConfirmDialog'
import { toast } from 'sonner'

interface DetailJobTitleFormProps {
    selectedJobTitle: JobTitle | null
    onCloseCard: () => void
}

const DetailJobTitleForm = ({
    selectedJobTitle,
    onCloseCard,
}: DetailJobTitleFormProps) => {
    const [editJobTitleName, setEditJobTitleName] = useState(
        selectedJobTitle?.title_name || ''
    )
    const [editCode, setEditCode] = useState(selectedJobTitle?.code || '')
    const [editDescription, setEditDescription] = useState(
        selectedJobTitle?.description || ''
    )

    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        // Scroll the grandparent container back to the top on component mount
        const scrollContainer = formRef.current?.parentElement?.parentElement
        if (scrollContainer) {
            scrollContainer.scrollTop = 0
        }
    }, [])

    const isAddingJobTitle = useJobTitleStore((s) => s.isAddingJobTitle)
    const setIsAddingJobTitle = useJobTitleStore(
        (s) => s.setIsAddingJobTitle
    )
    const setActiveJobTitleId = useJobTitleStore(
        (s) => s.setActiveJobTitleId
    )

    // Mutation hooks
    const createJobTitleMutation = useCreateJobTitle()
    const updateJobTitleMutation = useUpdateJobTitle()
    const deleteJobTitleMutation = useDeleteJobTitle()

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const isSubmitting =
        createJobTitleMutation.isPending ||
        updateJobTitleMutation.isPending ||
        deleteJobTitleMutation.isPending

    const handleCreateJobTitle = async (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault()

        const payload: AddJobTitlePayload = {
            title_name: editJobTitleName.trim(),
            code: editCode.trim(),
            description: editDescription.trim()
                ? editDescription.trim()
                : undefined,
        }
        createJobTitleMutation.mutate(payload, {
            onSuccess: (created) => {
                toast.success('Job title created successfully!')
                setActiveJobTitleId(created.id)
                setIsAddingJobTitle(false)
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ?? 'Failed to create job title.'
                )
            },
        })
    }

    const handleUpdateJobTitle = (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault()
        if (!selectedJobTitle) return

        const payload: UpdateJobTitlePayload = {
            title_name: editJobTitleName.trim(),
            description: editDescription.trim()
                ? editDescription.trim()
                : undefined,
        }

        updateJobTitleMutation.mutate(
            {
                id: selectedJobTitle.id,
                payload,
            },
            {
                onSuccess: async () => {
                    toast.success('Job title updated successfully!')
                },
                onError: (err: any) => {
                    toast.error(
                        err.response?.data?.detail ??
                            'Failed to update job title.'
                    )
                },
            }
        )
    }

    const handleDeleteJobTitle = () => {
        if (!selectedJobTitle) return

        deleteJobTitleMutation.mutate(selectedJobTitle.id, {
            onSuccess: () => {
                toast.success('Job title deleted successfully.')
                setActiveJobTitleId(null)
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ?? 'Failed to delete job title.'
                )
            },
        })
    }

    return (
        <>
            <div className="space-y-6 h-full">
                {/* Form: Create or Update */}
                <form
                    ref={formRef}
                    onSubmit={
                        isAddingJobTitle
                            ? handleCreateJobTitle
                            : handleUpdateJobTitle
                    }
                    className="space-y-4 flex flex-col h-full"
                >
                    {/* Department Information Fields */}
                    <JobTitleInfoFields
                        editJobTitleName={editJobTitleName}
                        setEditJobTitleName={setEditJobTitleName}
                        editCode={editCode}
                        setEditCode={setEditCode}
                        editDescription={editDescription}
                        setEditDescription={setEditDescription}
                        mode={isAddingJobTitle ? 'create' : 'edit'}
                    />

                    <div className="flex-1"></div>

                    {/* Save / Cancel buttons */}
                    <div className="flex gap-2.5 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCloseCard}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isSubmitting}
                            loadingText={
                                isAddingJobTitle ? 'Creating...' : 'Saving...'
                            }
                        >
                            {isAddingJobTitle
                                ? 'Create Job Title'
                                : 'Save Changes'}
                        </Button>
                    </div>

                    {/* Delete Job Title button */}
                    {!isAddingJobTitle && !showDeleteConfirm && (
                        <div className="flex items-center justify-between gap-4 py-3 hover:bg-error-bg/10 rounded-xl transition-all">
                            <div>
                                <p className="text-xs font-semibold text-error-text">
                                    Delete Job Title
                                </p>
                                <p className="text-[10px] text-text-placeholder leading-normal mt-0.5">
                                    Permanently delete job title
                                </p>
                            </div>
                            <Button
                                variant="danger"
                                size="sm"
                                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isSubmitting}
                            >
                                Delete
                            </Button>
                        </div>
                    )}
                </form>
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteJobTitle}
                title="Delete Job Title?"
                description="This will delete the job title immediately. This action is irreversible."
                confirmLabel="Yes, delete"
                variant="danger"
                isLoading={isSubmitting}
            />
        </>
    )
}

export default DetailJobTitleForm

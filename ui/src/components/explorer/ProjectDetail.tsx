import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { ProjectResponse, SceneResponse } from "@/types";

import {
  createProject,
  createScene,
  deleteProject,
  getNextSceneNumber,
  getProjectById,
  getProjectTypes,
  listScenes,
  updateProject,
  validateProjectName,
  validateSceneName,
  validateSceneNumber,
} from "@/api/hierarchy";
import {
  type ActionButton,
  EntityDetailsCard,
} from "@/components/explorer/details/EntityDetailsCard";
import EntityTabsSection from "@/components/explorer/details/EntityTabsSection";
import { useExplorerTree } from "@/components/explorer/tree-context/use-explorer-tree";
import { CreateItemDialog } from "@/components/generations/hierarchy/CreateItemDialog";
import { toValidationResult } from "@/components/generations/hierarchy/use-hierarchy-actions";
import { FormInputField } from "@/components/shared/FormInputField";
import { FormTextAreaField } from "@/components/shared/FormTextAreaField";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/context/AlertContext";
import { formatDate } from "@/lib/date-fmt";

interface ProjectDetailProps {
  readonly selectedProjectId?: number | null;
}

export default function ProjectDetail({ selectedProjectId }: ProjectDetailProps) {
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [scenes, setScenes] = useState<SceneResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("");
  const [projectTypeOptions, setProjectTypeOptions] = useState<string[]>([]);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createSceneOpen, setCreateSceneOpen] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const { reportError, error: errorALert, confirm: confirmAlert } = useAlert();
  const { updateNode, removeNode, addNode, handleSelect, selectNode } = useExplorerTree();

  const load = useCallback(
    async (abortSignal?: AbortSignal) => {
      if (!selectedProjectId) {
        setProject(null);
        setScenes([]);
        return;
      }
      setLoading(true);

      try {
        const proj = await getProjectById(selectedProjectId, abortSignal);
        const projectScenes = await listScenes(selectedProjectId, abortSignal);

        if (!abortSignal?.aborted) {
          setProject(proj);
          setName(proj.name);
          setDescription(proj.description ?? "");
          setProjectType(proj.project_type);
          setScenes(projectScenes);
        }
      } catch (error) {
        void reportError(error);
      } finally {
        setLoading(false);
      }
    },
    [reportError, selectedProjectId],
  );

  useEffect(() => {
    void getProjectTypes().then((opt: string[]) => {
      setProjectTypeOptions(opt);
    });
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, react-hooks/set-state-in-effect
    load(abort.signal);
    return () => {
      abort.abort();
    };
  }, [load]);

  // Sync tree selection when project is loaded
  useEffect(() => {
    if (!project || loading) return;

    const abort = new AbortController();
    selectNode({ node: { kind: "project", data: project }, abortController: abort, pane: "tree" });

    return () => abort.abort();
  }, [project, loading, selectNode]);

  if (!selectedProjectId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select an item in the explorer
      </div>
    );
  }

  if (!project && !loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Project not found
      </div>
    );
  }

  if (loading || !project) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">Loading…</div>
    );
  }

  const dirty =
    name !== project.name ||
    description !== (project.description ?? "") ||
    projectType !== project.project_type;

  const handleSave = async () => {
    if (!project) return;

    // Validate name if changed
    if (name.trim() && nameError) {
      return;
    }

    // Client-side validation for required fields
    if (!name.trim() || !projectType) {
      void errorALert({ title: "Name and Type are required fields" });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProject(project.id, {
        name,
        description,
        project_type: projectType,
      });
      setProject(updated);
      // Update the node in the tree to reflect the new name
      updateNode({ kind: "project", data: updated });
      setNameError(null);
      toast.success("Project saved successfully");
    } catch (error) {
      void errorALert({ title: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const validateProjectNameField = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError("Name is required");
      return { isValid: false };
    }
    if (trimmed === project.name) {
      setNameError(null);
      return { isValid: true };
    }
    try {
      const result = await validateProjectName({
        name: trimmed,
      });
      if (!result.is_unique) {
        setNameError(`Duplicate project name`);
        return {
          isValid: false,
          message: "Duplicate project name",
        };
      }
      setNameError(null);
      return { isValid: true };
    } catch {
      setNameError(null);
      return { isValid: true };
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    if (scenes.length > 0) {
      void errorALert({
        title: "Cannot delete project",
        description: "Delete all scenes before deleting this project.",
      });
      return;
    }
    const confirmed = await confirmAlert({
      title: `Delete project "${project.name}"?`,
      description: "This will permanently delete the project. This action cannot be undone.",
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      await deleteProject(project.id);
      // Remove the node from the tree
      removeNode({ kind: "project", id: project.id });
      setProject(null);
      setScenes([]);
      toast.success("Project deleted");
      handleSelect({ kind: "explorer" });
    } catch (error) {
      void reportError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async (raw: Record<string, string>): Promise<ProjectResponse> => {
    return createProject({
      payload: {
        name: raw.name.trim(),
        // raw.project_type is only absent on the "use defaults" path —
        // the dialog path always supplies it as a required field.
        project_type: raw.project_type,
        description: raw.description?.trim() || null,
      },
    });
  };

  const onProjectCreated = (newProject: ProjectResponse) => {
    toast.info(`Project: "${newProject.name}" created`);

    // Add the new project to the tree
    addNode({ kind: "project", data: newProject });
  };

  const handleCreateScene = async (raw: Record<string, string>) => {
    return createScene({
      projectId: project.id,
      payload: {
        name: raw.name.trim(),
        number: raw.number ? Number(raw.number) : null,
        description: raw.description?.trim() || null,
        comments: raw.comments?.trim() || null,
      },
    });
  };

  const onSceneCreated = (newScene: SceneResponse) => {
    setScenes((prev) => [...prev, newScene]);
    toast.success(`Scene: "${newScene.name}" created`);
    // Add the new scene to the tree under this project
    addNode({ kind: "scene", data: newScene }, { kind: "project", id: project.id });
  };

  const actionButtons: ActionButton[] = [
    {
      label: "Delete",
      variant: "destructive",
      icon: <Trash2 />,
      onClick: handleDelete,
      hoverText:
        scenes.length > 0
          ? "This project cannot be deleted because it contains scenes. Delete all scenes first."
          : "This will permanently delete the project.",
    },
    {
      label: "Add Scene",
      variant: "secondary",
      icon: <Plus />,
      onClick: () => setCreateSceneOpen(true),
    },
    {
      label: "Add Project",
      variant: "secondary",
      icon: <Plus />,
      onClick: () => setCreateProjectOpen(true),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-2 pt-0">
      <EntityDetailsCard
        title={project.name}
        description={formatDate(new Date(project.added_on * 1000))}
        onRefresh={load}
        actionButtons={actionButtons}
        className="bg-workspace"
        entityType="Project"
      >
        <FormInputField
          id="project-name"
          label="Name"
          required
          value={name}
          onChange={setName}
          validator={validateProjectNameField}
          error={nameError}
        />
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Combobox
            items={projectTypeOptions}
            value={projectType}
            onValueChange={(val) => setProjectType(val ?? "default")}
          >
            <ComboboxInput
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="Select a project type"
            />
            <ComboboxContent>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <FormTextAreaField label="Description" value={description} onChange={setDescription} />
        <div className="flex justify-center">
          <Button
            className="w-[60%]"
            variant="secondary"
            onClick={() => void handleSave()}
            disabled={!dirty || saving || !!nameError}
          >
            Save Project
          </Button>
        </div>
      </EntityDetailsCard>

      <EntityTabsSection<SceneResponse>
        itemLabel="Scenes"
        items={scenes}
        onItemClick={(scene) => handleSelect({ kind: "scene", data: scene })}
        sortByNumber
      />

      <CreateItemDialog<ProjectResponse>
        level="project"
        levelLabel="Project"
        open={createProjectOpen}
        onOpenChange={() => setCreateProjectOpen(false)}
        initialName={""}
        validateName={async (name, signal) => {
          const trimmed = name.trim();
          return toValidationResult(
            await validateProjectName({ name: trimmed, abortSignal: signal }),
            "project",
            trimmed,
          );
        }}
        fields={[
          {
            key: "project_type",
            label: "Project type",
            type: "combo",
            required: true,
            placeholder: "Enter existing or new project type",
            emptyText: "No matching types — this will be added as a new one",
            search: (query: string) => {
              const normalized = query.toLowerCase();
              return Promise.resolve(
                projectTypeOptions.filter((hint) => hint.toLowerCase().includes(normalized)),
              );
            },
          },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        onSubmit={handleCreateProject}
        onCreated={onProjectCreated}
      />

      <CreateItemDialog<SceneResponse>
        level="scene"
        levelLabel="Scene"
        open={createSceneOpen}
        onOpenChange={() => setCreateSceneOpen(false)}
        initialName={""}
        validateName={async (name, signal) => {
          const trimmed = name.trim();
          return toValidationResult(
            await validateSceneName({
              projectId: project.id,
              name: trimmed,
              abortSignal: signal,
            }),
            "scene",
            trimmed,
          );
        }}
        fields={[
          {
            key: "number",
            label: `Scene Number`,
            type: "number",
            validate: async (value, signal) => {
              const trimmed = value.trim();
              if (!trimmed) return { isValid: true };
              const number = Number(trimmed);
              return toValidationResult(
                await validateSceneNumber({
                  projectId: project.id,
                  number,
                  abortSignal: signal,
                }),
                "scene",
                trimmed,
              );
            },
            getNextNumber: (signal) => {
              return getNextSceneNumber({ projectId: project.id, abortSignal: signal });
            },
          },
          { key: "description", label: "Description", type: "textarea" },
          { key: "comments", label: "Comments", type: "textarea" },
        ]}
        onSubmit={handleCreateScene}
        onCreated={onSceneCreated}
      />
    </div>
  );
}

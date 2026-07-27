import { FolderOpen } from "lucide-react";

import type {
  AssetResponse,
  GenerationDetailResponse,
  ModelUsedInfo,
  ShotHierarchicalResponse,
} from "@/types";

import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlert } from "@/context/AlertContext";
import { formatDate } from "@/lib/date-fmt";
import { revealAssetInDir } from "@/lib/reveal-file";
import { UnexpectedError } from "@/lib/unexpected-error";
import { cn, formatBytes } from "@/lib/utils";

export default function GenerationMetadata({
  generation,
}: Readonly<{
  generation: GenerationDetailResponse;
}>) {
  const output = generation.generation_assets.find((a) => a.assoc_type === "output");
  if (!output) {
    throw new UnexpectedError("IdentityStrip: Output asset not found");
  }

  return (
    <div className="flex w-full h-full m-0 px-2">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="mt-4">
          <SummaryTab generation={generation} output={output} />
        </TabsContent>

        <TabsContent value="workflow" className="mt-4">
          <WorkflowTab generation={generation} />
        </TabsContent>

        <TabsContent value="models" className="mt-4">
          <ModelsTab generation={generation} />
        </TabsContent>

        <TabsContent value="output" className="mt-4">
          <OutputTab generation={generation} output={output} />
        </TabsContent>

        <TabsContent value="input" className="mt-4">
          <InputTab generation={generation} />
        </TabsContent>

        <TabsContent value="hierarchy" className="mt-4">
          <HierarchyTab shot={generation.shot} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryTab({
  generation,
  output,
}: Readonly<{
  generation: GenerationDetailResponse;
  output: GenerationDetailResponse["generation_assets"][0];
}>) {
  return (
    <div className="grid grid-cols-[max-content_1fr] text-sm font-mono ">
      <GridRow label="Workflow" values={[generation.workflow_name ?? ""]} />
      <GridRow label="File" values={[output.asset.file_name]} revealAssets={[output.asset]} />
      <GridRow
        label="Meta"
        values={[
          `${output.asset.width} x ${output.asset.height}`,
          output.asset.fps ? `${output.asset.fps} fps` : ``,
          output.asset.duration_seconds ? `${output.asset.duration_seconds} s` : ``,
        ]}
      />

      <GridRow label="Created" values={[formatDate(output.asset.file_timestamp)]} />
      <GridRow
        label="Input #"
        lastRow={true}
        values={[generation.input_files_count?.toString() ?? ""]}
      />
    </div>
  );
}

function WorkflowTab({ generation }: Readonly<{ generation: GenerationDetailResponse }>) {
  return (
    <>
      <div className="grid grid-cols-[max-content_1fr] text-sm font-mono ">
        <GridRow label="Name" values={[generation.workflow_name ?? ""]} />
        <GridRow label="Type" values={[generation.workflow_type ?? ""]} />
        <GridRow label="Config" values={[`CFG: ${generation.cfg}`, `Steps: ${generation.steps}`]} />
        <GridRow label="Sampler" values={[generation.sampler ?? ""]} />
        <GridRow label="Scheduler" values={[generation.scheduler ?? ""]} />
      </div>
    </>
  );
}

function modelLabel(model: ModelUsedInfo): { label: string; values: (string | null)[] } {
  switch (model.role) {
    case "latent_upscaler": {
      return { label: "Upscaler", values: [model.name] };
    }
    case "lora": {
      return { label: "Lora", values: [model.name] };
    }
    case "text_encoder": {
      return { label: "Encoder", values: [model.name] };
    }
    case "vae": {
      return { label: "VAE", values: [model.name] };
    }
    case "primary_generation_model": {
      return { label: "Primary", values: [model.name] };
    }
    default: {
      return { label: model.role, values: [model.name] };
    }
  }
}

function ModelsTab({ generation }: Readonly<{ generation: GenerationDetailResponse }>) {
  if (!generation.models_json || generation.models_json.length === 0) {
    return <div className="text-sm-plus text-muted-foreground">No models used</div>;
  }

  return (
    <>
      <div className="grid grid-cols-[max-content_1fr] text-sm font-mono ">
        {generation.models_json?.map((m) => (
          <GridRow key={m.node_id} {...modelLabel(m)} />
        ))}
      </div>
    </>
  );
}

function OutputTab({
  generation,
  output,
}: Readonly<{
  generation: GenerationDetailResponse;
  output: GenerationDetailResponse["generation_assets"][0];
}>) {
  return (
    <>
      <div className="grid grid-cols-[max-content_1fr] text-sm font-mono">
        <GridRow label="Name" values={[output.asset.file_name]} revealAssets={[output.asset]} />
        <GridRow label="Created" values={[formatDate(output.asset.file_timestamp)]} />
        <GridRow
          label="File"
          values={[output.asset.mime_type, formatBytes(output.asset.file_size ?? 0)]}
        />
        <GridRow
          label="Video"
          values={[
            `${output.asset.duration_seconds} s`,
            `${output.asset.fps} fps`,
            `${generation.frame_count} frames`,
          ]}
        />
        <GridRow
          label="Dimensions"
          values={[
            `${output.asset.width} x ${output.asset.height}`,
            `req: ${generation.requested_width} x ${generation.requested_height}`,
          ]}
        />
      </div>
    </>
  );
}

function InputTab({ generation }: Readonly<{ generation: GenerationDetailResponse }>) {
  const inputAssets = generation.generation_assets.filter((ga) => ga.assoc_type === "input");

  if (inputAssets.length === 0) {
    return <div className="text-sm-plus text-muted-foreground">No input assets</div>;
  }

  return (
    <>
      {inputAssets.map((inputAsset, index) => {
        const asset = inputAsset.asset;
        const isVideo =
          (asset.mime_type?.startsWith("video/") ?? false) ||
          asset.duration_seconds != null ||
          asset.fps != null;

        return (
          <div key={inputAsset.asset.id} className={index > 0 ? "mt-6 pt-6 border-t" : ""}>
            <div className="grid grid-cols-[max-content_1fr] text-sm font-mono">
              <GridRow label="Name" values={[asset.file_name]} revealAssets={[asset]} />
              <GridRow label="Created" values={[formatDate(asset.file_timestamp)]} />
              <GridRow label="File" values={[asset.mime_type, formatBytes(asset.file_size ?? 0)]} />
              {isVideo && (
                <GridRow
                  label="Video"
                  values={[
                    asset.duration_seconds == null ? null : `${asset.duration_seconds} s`,
                    asset.fps == null ? null : `${asset.fps} fps`,
                  ].filter((v) => v != null)}
                />
              )}
              <GridRow
                label="Dimensions"
                values={[
                  asset.width != null && asset.height != null
                    ? `${asset.width} x ${asset.height}`
                    : null,
                ]}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

function HierarchyTab({ shot }: Readonly<{ shot: ShotHierarchicalResponse | null }>) {
  return (
    <div className="grid grid-cols-[max-content_1fr] text-sm font-mono">
      <GridRow label="Shot" values={[shot?.number, shot?.name, shot ? "" : "Shot not selected"]} />
      <GridRow label="Clip" values={[shot?.clip.number, shot?.clip.name]} />
      <GridRow label="Scene" values={[shot?.clip.scene.number, shot?.clip.scene.name]} />
      <GridRow label="Project" values={[shot?.clip.scene.project.name]} />
    </div>
  );
}

function RevealButton({
  asset,
}: Readonly<{
  asset: Pick<AssetResponse, "orig_file_path" | "id" | "file_name">;
}>) {
  const alertDialog = useAlert();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // eslint-disable-next-line unicorn/prefer-await
    revealAssetInDir(asset, alertDialog).catch((error) => {
      void alertDialog.reportError(error);
    });
  };

  return (
    <HoverCard>
      <HoverCardTrigger delay={0}>
        <Button variant="ghost" size="icon" className="ml-1" onClick={handleClick}>
          <FolderOpen />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-auto max-w-sm bg-black">
        <p className="text-sm">Reveal file in system file manager</p>
      </HoverCardContent>
    </HoverCard>
  );
}

function GridRow({
  label,
  values,
  revealAssets,
  lastRow,
}: Readonly<{
  label: string;
  values: (string | null | number | undefined)[];
  revealAssets?: Pick<AssetResponse, "orig_file_path" | "id" | "file_name">[];
  lastRow?: boolean;
}>) {
  return (
    <>
      <span className={cn(lastRow ? "" : "border-b", "p-2 text-muted-foreground")}>{label}</span>
      <span className={cn(lastRow ? "" : "border-b", "p-2")}>
        {values
          ?.filter((v) => v?.toString().length)
          ?.map((value, idx) => {
            const asset = revealAssets?.[idx];
            return (
              <span key={value} className="mr-2 inline-flex items-center align-middle">
                <HoverCard key={value}>
                  <HoverCardTrigger
                    delay={value && value.toString()?.length > 25 ? 0 : 25 * 10_000}
                  >
                    <span
                      className="inline-block max-w-56 cursor-default overflow-hidden
                               text-ellipsis whitespace-nowrap rounded-sm bg-muted
                               px-2 py-0.5 text-xs-plus"
                    >
                      {value}
                    </span>
                  </HoverCardTrigger>

                  <HoverCardContent
                    className="w-auto max-w-md break-all font-mono text-base bg-black"
                    side="left"
                  >
                    {value}
                  </HoverCardContent>
                </HoverCard>
                {asset && <RevealButton asset={asset} />}
              </span>
            );
          })}
      </span>
    </>
  );
}

export function DebugMetadata({ generation }: Readonly<{ generation: GenerationDetailResponse }>) {
  const output = generation.generation_assets.find((a) => a.assoc_type === "output");
  if (!output) {
    throw new UnexpectedError("IdentityStrip: Output asset not found");
  }
  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center text-sm-plus">
          Workflow: {generation.workflow_name} [ {generation.workflow_type} ]
        </div>
        <div className="flex items-center text-sm-plus"></div>
        <div className="flex items-center text-sm-plus">
          <div>
            Output: {output.asset.file_name} {output.asset.width}x{output.asset.height}{" "}
          </div>
        </div>
      </div>

      <div>------------------</div>
      <div>
        Maybe
        <div className="ml-4">
          <div>accepted: {generation.accepted}</div>
          <div>attempt_num: {generation.attempt_num}</div>
          <div>project_id: {generation.project_id}</div>
          <div>added_on: {formatDate(generation.added_on * 1000)}</div>
          <div>shot_id: {generation.shot_id}</div>
        </div>
        <div>Workflow settings</div>
        <div className="ml-4">
          <div>workflow_name*: {generation.workflow_name}</div>
          <div>cfg*: {generation.cfg}</div>
          <div>sampler*: {generation.sampler}</div>
          <div>scheduler*: {generation.scheduler}</div>
          <div>steps*: {generation.steps}</div>
        </div>
        <div>
          <div>Output</div>
          <div className="ml-4">
            <div>output.asset.file_name: {output.asset.file_name}</div>
            <div>output.asset.file_timestamp: {formatDate(output.asset.file_timestamp)}</div>
            <div>output.asset.file_size: {output.asset.file_size} b</div>
            <div>output.asset.duration_seconds: {output.asset.duration_seconds}</div>
            <div>output.asset.fps: {output.asset.fps}</div>
            <div>frame_count: {generation.frame_count}</div>
            <div>requested_width: {generation.requested_width}</div>
            <div>output.asset.width: {output.asset.width}</div>
            <div>requested_height: {generation.requested_height}</div>
            <div>output.asset.height: {output.asset.height}</div>
            <div>output.asset.mime_type: {output.asset.mime_type}</div>
            <div>output.asset.description: {output.asset.description} (llm description)</div>
          </div>
        </div>
        <div>
          <div>Input</div>
          <div className="ml-4">
            <div>input_files_count: {generation.input_files_count}</div>
            <div>...same info as output file</div>
          </div>
        </div>
        <div>
          <div>All models</div>
          <div className="ml-4">
            {generation.models_json?.map((m) => {
              return (
                <div key={m.node_id}>
                  <div>node_id: {m.node_id}</div>
                  <div className="ml-4">
                    <div>name: {m.name}</div>
                    <div>title: {m.title}</div>
                    <div>class_type: {m.class_type}</div>
                    <div>role: {m.role}</div>
                    <div>strength: {m.strength}</div>
                    <div>strength_clip: {m.strength_clip}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

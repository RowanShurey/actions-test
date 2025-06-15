export type JobStatus = "completed" | "processing" | "cancelled";

export interface MockFile {
  name: string;
  size: number;
}

export interface Job {
  id: string;
  datetime: string;
  status: JobStatus;
  inputFiles?: MockFile[];
  outputFiles?: MockFile[];
}

function randomDate() {
  return new Date(
    Date.now() - Math.floor(Math.random() * 100000000)
  ).toISOString();
}

const mockFile = (name: string): MockFile => ({
  name,
  size: 100,
});

export const mockJobs: Job[] = [
  {
    id: "J:1821",
    datetime: randomDate(),
    status: "completed",
    inputFiles: [mockFile("case1.txt"), mockFile("case2.txt")],
    //outputFiles: [mockFile("ANON_case1.txt"), mockFile("ANON_case2.txt"), mockFile("ANON_case2.txt"), mockFile("ANON_case2.txt"), mockFile("ANON_case2.txt"), mockFile("ANON_case2.txt"), mockFile("ANON_case2.txt"), mockFile("ANON_case2.txt"), mockFile("ANON_case2.txt"), mockFile("ANON_case2.txt")],
    outputFiles: [mockFile("ANON_case1.txt"), mockFile("ANON_case2.txt")],
  },
  {
    id: "J:1242",
    datetime: randomDate(),
    status: "processing",
    //inputFiles: [mockFile("case1.txt"), mockFile("case2 super long name testing testing testing testing testing testing testing testing testing really long name.txt"),mockFile("case3.txt"),mockFile("case4.txt"),mockFile("case5.txt"), mockFile("case6.txt"), mockFile("case7.txt"), mockFile("case8.txt"),mockFile("case9.txt"),mockFile("case10.txt"),mockFile("case11.txt"), mockFile("case12.txt")],
    inputFiles: [mockFile("case1.txt")]
  },
  {
    id: "J:1287",
    datetime: randomDate(),
    status: "completed",
    inputFiles: [mockFile("case2.txt")],
    outputFiles: [mockFile("ANON_case2.txt")],
  },
  {
    id: "J:18721",
    datetime: randomDate(),
    status: "processing",
    inputFiles: [mockFile("case3.txt")],
  },
  {
    id: "J:9712",
    datetime: randomDate(),
    status: "cancelled",
    inputFiles: [mockFile("case4.txt")],
    outputFiles: [mockFile("ANON_case4.txt")],
  },
];

export function getProcessingJobs() {
  return mockJobs.filter((job) => job.status === "processing");
}

export function getCompletedJobs() {
  return mockJobs.filter((job) => job.status === "completed");
}

export function addNewProcessingJob(files: MockFile[]): Job {
  // Generate a random 3-digit number for the job ID
  const randomId = Math.floor(100 + Math.random() * 900).toString();
  const newJob: Job = {
    id: `J:${randomId}`,
    datetime: new Date().toISOString(),
    status: "processing",
    inputFiles: files,
  };
  mockJobs.push(newJob);
  return newJob;
}

export function updateJob(newJob: Job, anonymizedFiles: MockFile[]) {
  const jobIndex = mockJobs.findIndex((j) => j.id === newJob.id);
  if (jobIndex !== -1) {
    mockJobs.splice(jobIndex, 1);
  }
  const newJob2: Job = {
    id: newJob.id,
    datetime: newJob.datetime,
    status: "completed",
    inputFiles: newJob.inputFiles,
    outputFiles: anonymizedFiles,
  };
  mockJobs.push(newJob2);

}

export function cancelJob(jobId: string) {
  const job = mockJobs.find((j) => j.id === jobId);
  if (job && job.status === "processing") {
    job.status = "cancelled";
    job.outputFiles = []; // optional: clear outputs if any
  }
}

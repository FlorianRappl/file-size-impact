import { assertAndNormalizeDirectoryUrl, resolveUrl } from "@jsenv/util"
import { commentGitHubPullRequestImpact } from "@jsenv/github-pull-request-impact"

import { formatComment } from "./internal/formatComment.js"
import { jsenvCommentParameters } from "./internal/jsenvCommentParameters.js"

export const reportFileSizeImpact = async ({
  logLevel,
  commandLogs,
  cancellationToken,
  cancelOnSIGINT,
  projectDirectoryUrl,

  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  installCommand = "npm install",
  buildCommand = "npm run-script build",
  moduleGeneratingFileSizeReportRelativeUrl,

  // We could just to ...jsenvCommentParameters but explicitely passing params
  // helps autocompletion in vscode for dev using the function.
  filesOrdering = jsenvCommentParameters.filesOrdering,
  maxRowsPerTable = jsenvCommentParameters.maxRowsPerTable,
  fileRelativeUrlMaxLength = jsenvCommentParameters.fileRelativeUrlMaxLength,
  formatGroupSummary = jsenvCommentParameters.formatGroupSummary,
  formatHiddenImpactSummary = jsenvCommentParameters.formatHiddenImpactSummary,
  formatFileRelativeUrl = jsenvCommentParameters.formatFileRelativeUrl,
  formatFileCell = jsenvCommentParameters.formatFileCell,
  formatFileSizeImpactCell = jsenvCommentParameters.formatFileSizeImpactCell,
  formatGroupSizeImpactCell = jsenvCommentParameters.formatGroupSizeImpactCell,
  shouldOpenGroupByDefault = jsenvCommentParameters.shouldOpenGroupByDefault,

  catchError,
  runLink,
  commitInGeneratedByInfo,
}) => {
  if (typeof installCommand !== "string") {
    throw new TypeError(`installCommand must be a string but received ${installCommand}`)
  }
  if (typeof buildCommand !== "string") {
    throw new TypeError(`buildCommand must be a string but received ${buildCommand}`)
  }
  projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)
  const moduleGeneratingFileSizeReportUrl = resolveUrl(
    moduleGeneratingFileSizeReportRelativeUrl,
    projectDirectoryUrl,
  )

  return commentGitHubPullRequestImpact({
    logLevel,
    commandLogs,
    cancellationToken,
    cancelOnSIGINT,
    projectDirectoryUrl,

    githubToken,
    repositoryOwner,
    repositoryName,
    pullRequestNumber,

    collectInfo: async ({ execCommandInProjectDirectory }) => {
      await execCommandInProjectDirectory(installCommand)
      await execCommandInProjectDirectory(buildCommand)

      const { generateFileSizeReport } = await import(
        `${moduleGeneratingFileSizeReportUrl}?cache_busting=${Date.now()}`
      )
      if (typeof generateFileSizeReport !== "function") {
        throw new TypeError(
          `generateFileSizeReport export must be a function, got ${generateFileSizeReport}`,
        )
      }
      const fileSizeReport = await generateFileSizeReport()

      return { version: 1, data: fileSizeReport }
    },
    commentIdentifier: `<!-- Generated by @jsenv/file-size-impact -->`,
    createCommentForComparison: ({
      pullRequestBase,
      pullRequestHead,
      beforeMergeData,
      afterMergeData,
    }) => {
      return formatComment({
        pullRequestBase,
        pullRequestHead,

        beforeMergeFileSizeReport: beforeMergeData,
        afterMergeFileSizeReport: afterMergeData,

        filesOrdering,
        maxRowsPerTable,
        fileRelativeUrlMaxLength,
        formatGroupSummary,
        formatHiddenImpactSummary,
        formatFileRelativeUrl,
        formatFileCell,
        formatFileSizeImpactCell,
        formatGroupSizeImpactCell,
        shouldOpenGroupByDefault,
      })
    },
    generatedByLink: {
      url: "https://github.com/jsenv/file-size-impact",
      text: "@jsenv/file-size-impact",
    },
    runLink,
    commitInGeneratedByInfo,
    catchError,
  })
}

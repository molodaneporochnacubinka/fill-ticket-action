
import * as core from '@actions/core';
import * as github from '@actions/github';
import fetch from 'node-fetch';
import * as exec from 'actions-exec-listener';

try {
    const apiHost = 'https://api.tracker.yandex.net';
    const ticketId = core.getInput('ticket-id');
    const xOrgId = core.getInput('x-org-id');
    const token = core.getInput('token');
    const tag = core.getInput('tag');

    const date = new Date().toLocaleDateString('en-US');
    const title = `Релиз ${tag} - ${date}`;

    let description = '';
    const actor = github.context.actor;
    description += `Ответственный за релиз: ${actor}\n\n`;
    description += `Коммиты, попавшие в релиз:\n\n`;

    const { stdoutStr: prevTagStr } = await exec.exec('git describe --abbrev=0 --tag');
    const prevTag = prevTagStr.replace(/\n/, '');

    const { stdoutStr: commits } = await exec.exec(`git log ${prevTag}..${tag} --pretty=format:"%h%x09%an%x09%s"`);

    description += commits;

    const url = `${apiHost}/v2/issues/${ticketId}`;

    const options = {
        method: 'patch',
        headers: {
            Authorization: `OAuth ${token}`,
            'X-Org-ID': xOrgId,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            summary: title,
            description: description
        }),
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    await response.json();
} catch (error) {
  core.setFailed(error.message);
}

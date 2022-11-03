
import * as core from '@actions/core';
import * as github from '@actions/github';
import fetch from 'node-fetch';
// import * as exec from 'actions-exec-listener';
import * as exec from '@actions/exec';

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

    let myOutput = '';

    const opts = {};
    opts.listeners = {
      stdout: (data) => {
        console.log(data);
        myOutput += data.toString();
      }
    };
    
    await exec.exec('git tag -l', [], opts);

    // const { stdoutStr: tagsStr } = await exec.exec('git tag -l');
    // const tags = tagsStr.split(/\n/);

    console.log(myOutput);

    const tags = myOutput.split(/\n/);

    let cmd = `git log --pretty=format:"%h%x09%an%x09%s"`
    if (tags.length > 2) {
      const prevTag = tags[tags.length - 3];
      cmd = `git log ${prevTag}..${tag} --pretty=format:"%h%x09%an%x09%s"`
    }

    myOutput = '';

    await exec.exec(cmd, [], opts);

    console.log(myOutput);

    const commits = myOutput;

    // const { stdoutStr: commits } = await exec.exec(cmd);

    description += commits;

    const url = `${apiHost}/v2/issues/${ticketId}`;

    const resOptions = {
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

    const response = await fetch(url, resOptions);

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    await response.json();
} catch (error) {
  core.setFailed(error.message);
}

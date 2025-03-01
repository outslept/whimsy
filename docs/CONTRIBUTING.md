# Contributing

This article explains how to contribute to the project. Please read through the following guidelines.

Write something nice and instructive as an intro. Talk about what kind of contributions you are interested in.

> Welcome! We love receiving contributions from our community, so thanks for stopping by! There are many ways to contribute, including submitting bug reports, improving documentation, submitting feature requests, reviewing new submissions, or contributing code that can be incorporated into the project.

## Summary

> [!Note]
> Before participating in our community, please read our [Code Of Conduct][coc].
> By interacting with this repository, organization, or community you agree to abide by its terms.

This document describes our development process. Following these guidelines shows that you respect the time and effort of the developers managing this project. In return, you will be shown respect in addressing your issue, reviewing your changes, and incorporating your contributions.

## Contributions

There are several ways to contribute, not just by writing code. If you have questions, see [support][support].

### Financial support

It's possible to support us financially by becoming a backer or sponsor through [Sponsor platform name][sponsor_platform] platforms.

### Improve docs

As a user, you’re perfect for helping us improve our docs. Typo corrections, error fixes, better explanations, new examples, etc.

### Improve issues

Some issues lack information, aren’t reproducible, or are just incorrect. You can help by trying to make them easier to resolve. Existing issues might benefit from your unique experience or opinions.

### Write code

Code contributions are very welcome.
It’s probably a good idea to first post a question or open an issue to report a bug or suggest a new feature before creating a pull request.

## Submitting an issue

- The issue tracker is for issues. Use discussions for support.
- Search the issue tracker (including closed issues) before opening a new issue.
- Ensure you’re using the latest version of our packages.
- Use a clear and descriptive title.
- Include as much information as possible: steps to reproduce the issue, error message, version, operating system, etc.
- The more time you put into an issue, the better we will be able to help you.
- The best issue report is a proper reproduction step to prove it.

## Development Process

What is your development process?

> [!Tip]
> This project follows the basic git flow.

Check and follow the [README][readme] file and run the project on your local environment.

Talk about branches people should work on. Specifically, where is the starting point? `main`, `feature`, `hotfix`, `task`, etc.

### Testing

If you add code, you need to add tests! We’ve learned the hard way that code without tests is undependable. If your pull request reduces our test coverage because it lacks tests, it will be rejected.

Provide instructions for adding new tests. Provide instructions for running tests.

```sh
npm run test
```

### Style Guidelines

Run the command below:

```sh
npm run lint
```

### Code Formatting

Use a code formatter in your IDE, and add Prettier and other useful extensions in your IDE.

### Git Commit Guidelines

Below are the guidelines for your commit messages.

- Add a clear message and keep it within 50 characters.
- Prefix the message with a feature or issue number from the issue page.

### Submitting a pull request

- Run `npm test` locally to build, format, and test your changes.
- Non-trivial changes are often best discussed in an issue first to prevent unnecessary work.
- For ambitious tasks, get your work in front of the community for feedback as soon as possible.
- New features should be accompanied by tests and documentation.
- Don’t include unrelated changes.
- Test before submitting code by running `npm test`.
- Write a convincing description of why we should land your pull request: it’s your job to convince us.

## Pull Request Process

When you are ready to generate a pull request, either for preliminary review or for consideration of merging into the project, you must first push your local topic branch back up to GitHub:

```sh
git push origin feature/branch-name
```

### Submitting the PR

Once you've committed and pushed all of your changes to GitHub, go to the page for your fork on GitHub, select your development branch, and click the pull request button.
If you need to make any adjustments to your pull request, just push the updates to your branch. Your pull request will automatically track the changes on your development branch and update.

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the `README.md` with details of changes to the interface. This includes new environment variables, exposed ports, useful file locations, and container parameters.
3. Increase the version numbers in any example files and the `README.md` to the new version that this Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/).
4. You may merge the Pull Request once you have the sign-off of two other developers. If you don’t have permission to do that, request the second reviewer to merge it for you.

### Review Process

The core team reviews Pull Requests regularly in a weekly triage meeting held in a public domain. The schedule is announced in weekly status updates.
Our Reviewer will provide constructive feedback by writing Review Comments (RC). The Pull Requester must address all RC in time.

After feedback has been given, we expect responses within two weeks. If no activity is shown within this time, we may close the pull request.
For larger commits, we prefer a +1 from someone on the core team or another contributor. Please note if you reviewed the code or tested locally.

### Addressing Feedback

Once a PR has been submitted, your changes will be reviewed, and constructive feedback may be provided. Feedback is not meant as an attack but helps ensure high-quality code. Changes will be approved once required feedback has been addressed.

If a maintainer asks you to "rebase" your PR, that means a lot of code has changed, and you need to update your fork to make merging easier.

To update your forked repository, follow these steps:

### Fetch upstream master and merge with your repo's main branch

```sh
git fetch upstream
git checkout main
git merge upstream/main
```

#### If there were any new commits, rebase your development branch

```sh
git checkout feature/branch-name
git rebase main
```

If too much code has changed, you may need to resolve merge conflicts manually.

Once your new branch has no conflicts and works correctly, override your old branch using this command:

```sh
git push origin feature/branch-name
```

## Community

We have a mailing list, Slack channel, and IRC channel. Links are provided below:

- You can help answer questions our users have here:
- You can help build and design our website here:
- You can help write blog posts about the project by:
- You can help with newsletters and internal communications by:

## Resources

- [How to contribute to open source](https://docs.github.com/en/get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github)
- [Making your first contribution](https://www.freecodecamp.org/news/how-to-make-your-first-open-source-contribution/)
- [Using pull requests](https://docs.github.com/en/pull-requests)
- [GitHub help](https://help.github.com)
- [Commit message guidelines](https://github.com/joelparkerhenderson/git-commit-message), [Commit guidelines](https://medium.com/@sharmapriyanka84510/commit-guidelines-f41b23f0bf4a)

## License

outslept

## Author

© outslept

<!-- contributingTemplateContent Definitions -->

[sponsor_platform]: https://github.com
[author]: https://github.com
[readme]: https://github.com
[support]: https://github.com
[coc]: https://github.com

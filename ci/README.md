# Workflow pendente

O token do agente não tem o escopo `workflow`. Para ativar o check, mova este arquivo para `.github/workflows/docs-build-check.yml`:

    git mv ci/docs-build-check.yml .github/workflows/docs-build-check.yml

Enquanto isso, rode `bash scripts/check_docs_build.sh` localmente.

# Deshiknaves Blog Datasource

This repository has a script that will get all the blog posts from Notion and then create entires in Supabase if they have changed. This will run entirely in a CI pipeline on CircleCI.

```mermaid
graph LR
    A[Manual Trigger - CircleCI] -->B[Get Notion Posts]
    B --> C{Exists in Supabase?}
    C --> |No| D[Create - Supabase]
    C -->|Yes| E{Updated?}
    E --> |Yes| F[Update - Supabase]
    E --> |No| G[Do Nothing]
```

# CodegenResult

**Source:** https://developers.figma.com/docs/plugins/api/CodegenResult/

---

```
type CodegenResult = {  
  // The title of the section  
  title: string  
  // The code of the section  
  code: string  
  // The language to use for syntax highlighting  
  language:  
    | 'TYPESCRIPT'  
    | 'CPP'  
    | 'RUBY'  
    | 'CSS'  
    | 'JAVASCRIPT'  
    | 'HTML'  
    | 'JSON'  
    | 'GRAPHQL'  
    | 'PYTHON'  
    | 'GO'  
    | 'SQL'  
    | 'SWIFT'  
    | 'KOTLIN'  
    | 'RUST'  
    | 'BASH'  
    | 'PLAINTEXT'  
}
```
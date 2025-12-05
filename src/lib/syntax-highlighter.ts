import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs'

// Register JSON language once
SyntaxHighlighter.registerLanguage('json', json)

// Export configured SyntaxHighlighter component
export { SyntaxHighlighter, vs2015 }

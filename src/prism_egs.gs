Prism.languages.egs := Prism.languages.extend \gorillascript,
  keyword: r"""
    $(Prism.languages.gorillascript.keyword.source)
    |
    \b(end|block|partial|extends)\b
  """g

Prism.languages.insert-before \egs, \operator,
  property: r"""
      [\.@]
      \w[\d\w]*(\-\w[\d\w]*)*\b
      |
      \w[\d\w]*(\-\w[\d\w]*)*\s*(?!:\s*(?:%>|%&gt;)):
    """g

Prism.languages.insert-before 'egs', 'keyword',
  deliminator: r'(%>|%&gt;|<%=?|&lt;=)'g

if Prism.languages.markup
  Prism.languages.insert-before 'egs', 'comment',
    markup:
      pattern: r'(%>|%&gt;)[\w\W]*?(?=(<%|&lt;%))'g
      lookbehind: true
      inside:
        markup:
          pattern: r'&lt;/?[\w:-]+\s*[\w\W]*?&gt;'g
          inside: Prism.languages.markup.tag.inside
        rest: Prism.languages.egs

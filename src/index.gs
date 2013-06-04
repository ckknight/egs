jQuery #($)
  $("#try-link").remove-class "hide"
  let mutable current-template = void
  let handle-try = do
    let mutable compiling = false
    let handle()
      if compiling
        handle-try()
        return
      let text = $("#try-input-template").val()
      current-template := EGS text
      compiling := true
      async err, result <- (from-promise! EGS.compile text)()
      compiling := false
      if err
        $("#try-input-template-wrap").add-class("error")
        $("#try-output-template").val "// Error compiling template: $(String err)"
      else
        $("#try-input-template-wrap").remove-class("error")
        $("#try-output-template").val result.code
      update-result()
    let mutable interval = void
    #
      if interval?
        clear-timeout interval
      interval := set-timeout handle, 250
  let update-result()
    let text = $("#try-input-data").val()
    async err, data <- (from-promise! GorillaScript.eval text)()
    if err
      $("#try-input-data-wrap").add-class("error")
      $("#try-output-result").val("// Error reading data: $(String err)")
    else
      if current-template
        async err, result <- (from-promise! current-template(data))()
        if err
          $("#try-input-data-wrap").add-class("error")
          $("#try-output-result").val("// Error rendering template: $(String err)")
        else
          $("#try-input-data-wrap").remove-class("error")
          $("#try-output-result").val(result)
  set-interval (do
    let mutable last-text = ""
    #
      let text = $("#try-input-template").val()
      if text != last-text
        last-text := text
        handle-try()), 17
  set-interval (do
    let mutable last-text = ""
    #
      let text = $("#try-input-data").val()
      if text != last-text
        last-text := text
        update-result()), 17
  let safe(func) -> #
    try
      return func@ this, ...arguments
    catch e
      set-immediate #-> throw e
    false
  $("a[href=#try]").click safe #
    handle-try()
    let $try = $("#try")
    $try.slide-toggle()
    $("#run-link").toggle-class "hide"
    false
  $("#irc-button").click safe #
    let url = $(this).data("url")
    $(this).replace-with $("<iframe id='irc-iframe' src='$url'></iframe>")
    false
  let mutable has-touch = window haskey 'ontouchstart'
  let mutable in-toc-label = false
  let mutable in-toc = false
  let handle-toc-unhover()
    if not in-toc and not in-toc-label and not has-touch
      $("#toc").remove-class "hover"
  $("#toc").remove-class "hover"
  if not has-touch
    $("#toc-label").add-class("no-touch").bind 'touchstart', safe #
      has-touch := true
      $(this).remove-class "no-touch"
      true
    $("#toc-label").hover(
      safe #
        if has-touch
          return
        in-toc-label := true
        $("#toc").add-class "hover"
      safe #
        if has-touch
          return
        in-toc-label := false
        set-timeout handle-toc-unhover, 17_ms)
    $("#toc").hover(
      safe #
        if has-touch
          return
        in-toc := true
        $("#toc").add-class "hover"
      safe #
        if has-touch
          return
        in-toc := false
        set-timeout handle-toc-unhover, 17_ms)
  $("#toc-label a").click safe #
    set-immediate #
      $("#toc").toggle-class "hover"
      set-timeout handle-toc-unhover, 17_ms
    false
  let side-by-side = do
    let pending = []
    let mutable working = false
    let flush()
      if pending.length == 0 or working
        return
      
      working := true
      
      let {gs-code, $js-code} = pending.shift()
      
      async err, result <- (from-promise! GorillaScript.compile gs-code, return: true, bare: true)()
      let $code = $js-code.find("code")
      $code.text if err?
        "// Error: $(String err)"
      else
        result.code
      
      async <- set-immediate()
      Prism.highlightElement($code[0])
      working := false
      flush()
    #(gs-code, $js-code)
      $js-code.find("code").text "// Compiling..."
      pending.push { gs-code, $js-code }
      flush()
  $('.gs-code').each #
    let $this = $(this)
    if $this.has-class "no-convert"
      return
    let $div = $("<div>")
    $this.replace-with $div
    $div.append $("<ul class='tabs'><li class='gs-tab active'><a href='#'>GorillaScript</a><li class='js-tab'><a href='#'>JavaScript</a></ul>")
    $div.append $this
    $div.find(".tabs a").on "click", safe #
      $div.find(".tabs li").remove-class "active"
      $(this).parent().add-class "active"
      if $(this).parent().has-class "gs-tab"
        $div.find(".js-code").hide()
        $div.find(".gs-code").show()
      else
        $div.find(".gs-code").hide()
        let mutable $js-code = $div.find(".js-code")
        if $js-code.length == 0
          $js-code := $("<pre class='js-code'><code class='language-javascript'></code></pre>")
          $div.append $js-code
          side-by-side $this.find("code").text(), $js-code
        $js-code.show()
      false
  let f = #
    if not Prism.languages.gorillascript
      return set-timeout f, 17_ms
    let $elements = $('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code')
    asyncfor next, element in $elements
      Prism.highlight-element element
      set-immediate next
  f()

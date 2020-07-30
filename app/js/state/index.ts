/*
 * The system state is a load of variables, representing the current state of
 * the system (not including the virtual machine, which for clarity has its own
 * module). Getters and setters for these state variables are defined here, as
 * well as other more complex methods for changing the system state. This module
 * also initializes the variables and saves them to local storage, so that the
 * state is maintained between sessions.
 */
import SystemError from './error'
import { examples } from './examples'
import File from './file'
import { Language, languages } from './languages'
import { Message, Reply } from './messages'
import { Mode } from './modes'
import { Property, defaults } from './properties'
import { load, save } from './storage'
import compile from '../compiler/index'
import lexer from '../compiler/lexer/index'
import { Lexeme } from '../compiler/lexer/lexeme'
import Comment from '../compiler/lexer/comment'
import { Options as CompilerOptions } from '../compiler/options'
import * as machine from '../machine/index'
import { Options as MachineOptions } from '../machine/options'
import { input } from '../tools/elements'

/** the system state object */
class State {
  // record of callbacks to execute on state change
  #replies: Partial<Record<Message, Reply[]>>
  // whether user's saved settings have been loaded in this session
  #savedSettingsHaveBeenLoaded: boolean
  // system settings
  #language: Language
  #mode: Mode
  #editorFontFamily: string
  #editorFontSize: number
  #outputFontFamily: string
  #outputFontSize: number
  #includeCommentsInExamples: boolean
  #loadCorrespondingExample: boolean
  #assembler: boolean
  #decimal: boolean
  #autoCompileOnLoad: boolean
  #autoRunOnLoad: boolean
  #autoFormatOnLoad: boolean
  #alwaysSaveSettings: boolean
  // help page properties
  #commandsCategoryIndex: number
  #showSimpleCommands: boolean
  #showIntermediateCommands: boolean
  #showAdvancedCommands: boolean
  // file memory
  #files: File[]
  #currentFileIndex: number
  #lexemes: Lexeme[]
  #comments: Comment[]
  #usage: any[]
  #routines: any[]
  #pcode: number[][]
  // machine runtime options
  #showCanvasOnRun: boolean
  #showOutputOnWrite: boolean
  #showMemoryOnDump: boolean
  #drawCountMax: number
  #codeCountMax: number
  #smallSize: number
  #stackSize: number
  #traceOnRun: boolean
  #activateHCLR: boolean
  #preventStackCollision: boolean
  #rangeCheckArrays: boolean
  // compiler options
  #canvasStartSize: number
  #setupDefaultKeyBuffer: boolean
  #turtleAttributesAsGlobals: boolean
  #initialiseLocals: boolean
  #allowCSTR: boolean
  #separateReturnStack: boolean
  #separateMemoryControlStack: boolean
  #separateSubroutineRegisterStack: boolean

  // constructor
  constructor () {
    // record of callbacks to execute on state change
    this.#replies = {}
    // whether user's saved settings have been loaded in this session
    this.#savedSettingsHaveBeenLoaded = load('savedSettingsHaveBeenLoaded')
    // system settings
    this.#language = load('language')
    this.#mode = load('mode')
    this.#editorFontFamily = load('editorFontFamily')
    this.#editorFontSize = load('editorFontSize')
    this.#outputFontFamily = load('outputFontFamily')
    this.#outputFontSize = load('outputFontSize')
    this.#includeCommentsInExamples = load('includeCommentsInExamples')
    this.#loadCorrespondingExample = load('loadCorrespondingExample')
    this.#assembler = load('assembler')
    this.#decimal = load('decimal')
    this.#autoCompileOnLoad = load('autoCompileOnLoad')
    this.#autoRunOnLoad = load('autoRunOnLoad')
    this.#autoFormatOnLoad = load('autoFormatOnLoad')
    this.#alwaysSaveSettings = load('alwaysSaveSettings')
    // help page properties
    this.#commandsCategoryIndex = load('commandsCategoryIndex')
    this.#showSimpleCommands = load('showSimpleCommands')
    this.#showIntermediateCommands = load('showIntermediateCommands')
    this.#showAdvancedCommands = load('showAdvancedCommands')
    // file memory
    this.#files = load('files')
    this.#currentFileIndex = load('currentFileIndex')
    this.#lexemes = load('lexemes')
    this.#comments = load('comments')
    this.#usage = load('usage')
    this.#routines = load('routines')
    this.#pcode = load('pcode')
    // machine runtime options
    this.#showCanvasOnRun = load('showCanvasOnRun')
    this.#showOutputOnWrite = load('showOutputOnWrite')
    this.#showMemoryOnDump = load('showMemoryOnDump')
    this.#drawCountMax = load('drawCountMax')
    this.#codeCountMax = load('codeCountMax')
    this.#smallSize = load('smallSize')
    this.#stackSize = load('stackSize')
    this.#traceOnRun = load('traceOnRun')
    this.#activateHCLR = load('activateHCLR')
    this.#preventStackCollision = load('preventStackCollision')
    this.#rangeCheckArrays = load('rangeCheckArrays')
    // compiler options
    this.#canvasStartSize = load('canvasStartSize')
    this.#setupDefaultKeyBuffer = load('setupDefaultKeyBuffer')
    this.#turtleAttributesAsGlobals = load('turtleAttributesAsGlobals')
    this.#initialiseLocals = load('initialiseLocals')
    this.#allowCSTR = load('allowCSTR')
    this.#separateReturnStack = load('separateReturnStack')
    this.#separateMemoryControlStack = load('separateMemoryControlStack')
    this.#separateSubroutineRegisterStack = load('separateSubroutineRegisterStack')

    // register to pass some machine signals on from here
    machine.on('showCanvas', () => { this.send('selectTab', 'canvas') })
    machine.on('showOutput', () => { this.send('selectTab', 'output') })
    machine.on('showMemory', () => { this.send('selectTab', 'memory') })
  }

  // initialise the app (i.e. send all property changed messages)
  async init (): Promise<void> {
    const response = await fetch('/status')
    const user = await response.json()
    if (user) {
      if (!this.savedSettingsHaveBeenLoaded) {
        await this.loadSavedSettings()
      }
    } else {
      this.savedSettingsHaveBeenLoaded = false
      this.alwaysSaveSettings = false
    }
    if (this.#files.length === 0) {
      this.#files.push(new File(this.language))
    } else if (this.#files.length === 1 && this.file.code === '') {
      this.file.language = this.language
    }
    // system settings
    this.send('languageChanged')
    this.send('modeChanged')
    this.send('editorFontFamilyChanged')
    this.send('editorFontSizeChanged')
    this.send('outputFontFamilyChanged')
    this.send('outputFontSizeChanged')
    this.send('includeCommentsInExamplesChanged')
    this.send('loadCorrespondingExampleChanged')
    this.send('assemblerChanged')
    this.send('decimalChanged')
    this.send('autoCompileOnLoadChanged')
    this.send('autoRunOnLoadChanged')
    this.send('autoFormatOnLoadChanged')
    this.send('alwaysSaveSettingsChanged')
    // help page properties
    this.send('commandsCategoryIndexChanged')
    this.send('showSimpleCommandsChanged')
    this.send('showIntermediateCommandsChanged')
    this.send('showAdvancedCommandsChanged')
    // file memory
    this.send('filesChanged')
    this.send('currentFileIndexChanged')
    this.send('lexemesChanged')
    this.send('commentsChanged')
    this.send('usageChanged')
    this.send('routinesChanged')
    this.send('pcodeChanged')
    // machine runtime options
    this.send('showCanvasOnRunChanged')
    this.send('showOutputOnWriteChanged')
    this.send('showMemoryOnDumpChanged')
    this.send('drawCountMaxChanged')
    this.send('codeCountMaxChanged')
    this.send('smallSizeChanged')
    this.send('stackSizeChanged')
    this.send('traceOnRunChanged')
    this.send('activateHCLRChanged')
    this.send('preventStackCollisionChanged')
    this.send('rangeCheckArraysChanged')
    // compiler options
    this.send('canvasStartSizeChanged')
    this.send('setupDefaultKeyBufferChanged')
    this.send('turtleAttributesAsGlobalsChanged')
    this.send('initialiseLocalsChanged')
    this.send('allowCSTRChanged')
    this.send('separateReturnStackChanged')
    this.send('separateMemoryControlStackChanged')
    this.send('separateSubroutineRegisterStackChanged')
    // all good
    this.send('systemReady')
  }

  // get whether user's saved settings have been loaded in this session
  get savedSettingsHaveBeenLoaded (): boolean { return this.#savedSettingsHaveBeenLoaded }

  // getters for system settings
  get language (): Language { return this.#language }
  get mode (): Mode { return this.#mode }
  get editorFontFamily (): string { return this.#editorFontFamily }
  get editorFontSize (): number { return this.#editorFontSize }
  get outputFontFamily (): string { return this.#outputFontFamily }
  get outputFontSize (): number { return this.#outputFontSize }
  get includeCommentsInExamples (): boolean { return this.#includeCommentsInExamples }
  get loadCorrespondingExample (): boolean { return this.#loadCorrespondingExample }
  get assembler (): boolean { return this.#assembler }
  get decimal (): boolean { return this.#decimal }
  get autoCompileOnLoad (): boolean { return this.#autoCompileOnLoad }
  get autoRunOnLoad (): boolean { return this.#autoRunOnLoad }
  get autoFormatOnLoad (): boolean { return this.#autoFormatOnLoad }
  get alwaysSaveSettings (): boolean { return this.#alwaysSaveSettings }

  // getters for help page properties
  get commandsCategoryIndex (): number { return this.#commandsCategoryIndex }
  get showSimpleCommands (): boolean { return this.#showSimpleCommands }
  get showIntermediateCommands (): boolean { return this.#showIntermediateCommands }
  get showAdvancedCommands (): boolean { return this.#showAdvancedCommands }

  // getters for file memory
  get files (): File[] { return this.#files }
  get currentFileIndex (): number { return this.#currentFileIndex }
  get file (): File { return this.files[this.currentFileIndex] }
  get filename (): string { return this.files[this.currentFileIndex].name }
  get code (): string { return this.files[this.currentFileIndex].code }
  get lexemes (): Lexeme[] { return this.#lexemes }
  get comments (): Comment[] { return this.#comments }
  get routines (): any[] { return this.#routines }
  get pcode (): number[][] { return this.#pcode }
  get usage (): any[] { return this.#usage }

  // getters for machine runtime options
  get showCanvasOnRun (): boolean { return this.#showCanvasOnRun }
  get showOutputOnWrite (): boolean { return this.#showOutputOnWrite }
  get showMemoryOnDump (): boolean { return this.#showMemoryOnDump }
  get drawCountMax (): number { return this.#drawCountMax }
  get codeCountMax (): number { return this.#codeCountMax }
  get smallSize (): number { return this.#smallSize }
  get stackSize (): number { return this.#stackSize }
  get traceOnRun (): boolean { return this.#traceOnRun }
  get activateHCLR (): boolean { return this.#activateHCLR }
  get preventStackCollision (): boolean { return this.#preventStackCollision }
  get rangeCheckArrays (): boolean { return this.#rangeCheckArrays }

  // getters for compiler options
  get canvasStartSize (): number { return this.#canvasStartSize }
  get setupDefaultKeyBuffer (): boolean { return this.#setupDefaultKeyBuffer }
  get turtleAttributesAsGlobals (): boolean { return this.#turtleAttributesAsGlobals }
  get initialiseLocals (): boolean { return this.#initialiseLocals }
  get allowCSTR (): boolean { return this.#allowCSTR }
  get separateReturnStack (): boolean { return this.#separateReturnStack }
  get separateMemoryControlStack (): boolean { return this.#separateMemoryControlStack }
  get separateSubroutineRegisterStack (): boolean { return this.#separateSubroutineRegisterStack }

  // derivative getters
  get machineOptions (): MachineOptions {
    return {
      showCanvasOnRun: this.showCanvasOnRun,
      showOutputOnWrite: this.showOutputOnWrite,
      showMemoryOnDump: this.showMemoryOnDump,
      drawCountMax: this.drawCountMax,
      codeCountMax: this.codeCountMax,
      smallSize: this.smallSize,
      stackSize: this.stackSize,
      traceOnRun: this.traceOnRun,
      activateHCLR: this.activateHCLR,
      preventStackCollision: this.preventStackCollision,
      rangeCheckArrays: this.rangeCheckArrays
    }
  }

  get compilerOptions (): CompilerOptions {
    return {
      canvasStartSize: this.canvasStartSize,
      setupDefaultKeyBuffer: this.setupDefaultKeyBuffer,
      turtleAttributesAsGlobals: this.turtleAttributesAsGlobals,
      initialiseLocals: this.initialiseLocals,
      allowCSTR: this.allowCSTR,
      separateReturnStack: this.separateReturnStack,
      separateMemoryControlStack: this.separateMemoryControlStack,
      separateSubroutineRegisterStack: this.separateSubroutineRegisterStack
    }
  }

  // set whether user's saved settings have been loaded in this session
  set savedSettingsHaveBeenLoaded (savedSettingsHaveBeenLoaded: boolean) {
    this.#savedSettingsHaveBeenLoaded = savedSettingsHaveBeenLoaded
    save('savedSettingsHaveBeenLoaded', savedSettingsHaveBeenLoaded)
  }

  // setters for system settings
  set language (language: Language) {
    const previousLanguage = this.language

    // check the input; the compiler cannot always do so, since the language can
    // be set on the HTML page itself
    if (!languages.includes(language)) {
      this.send('error', new SystemError(`Unknown language "${language}".`))
    }
    this.#language = language
    save('language', language)
    this.send('languageChanged')

    // set file as not compiled
    this.file.compiled = false
    save('files', this.files)
    this.send('codeChanged') // update the syntax highlighting

    // if the file is empty, update its language
    if (this.code === '') {
      this.file.language = language
      this.send('filesChanged')
    }

    // maybe load corresponding example
    if (this.files) { // false when language is set on first page load
      if (previousLanguage !== language) { // stop infinite loop from example setting the language
        if (this.file.example && this.loadCorrespondingExample) {
          this.openExampleFile(this.file.example)
        }
      }
    }
  }

  set mode (mode: Mode) {
    this.#mode = mode
    save('mode', mode)
    this.send('modeChanged')
  }

  set editorFontFamily (editorFontFamily: string) {
    this.#editorFontFamily = editorFontFamily
    save('editorFontFamily', editorFontFamily)
    this.send('editorFontFamilyChanged')
  }

  set editorFontSize (editorFontSize: number) {
    this.#editorFontSize = editorFontSize
    save('editorFontSize', editorFontSize)
    this.send('editorFontSizeChanged')
  }

  set outputFontFamily (outputFontFamily: string) {
    this.#outputFontFamily = outputFontFamily
    save('outputFontFamily', outputFontFamily)
    this.send('outputFontFamilyChanged')
  }

  set outputFontSize (outputFontSize: number) {
    this.#outputFontSize = outputFontSize
    save('outputFontSize', outputFontSize)
    this.send('outputFontSizeChanged')
  }

  set includeCommentsInExamples (includeCommentsInExamples: boolean) {
    this.#includeCommentsInExamples = includeCommentsInExamples
    save('includeCommentsInExamples', includeCommentsInExamples)
    this.send('includeCommentsInExamplesChanged')
  }

  set loadCorrespondingExample (loadCorrespondingExample: boolean) {
    this.#loadCorrespondingExample = loadCorrespondingExample
    save('loadCorrespondingExample', loadCorrespondingExample)
    this.send('loadCorrespondingExampleChanged')
  }

  set assembler (assembler: boolean) {
    this.#assembler = assembler
    save('assembler', assembler)
    this.send('pcodeChanged')
  }

  set decimal (decimal: boolean) {
    this.#decimal = decimal
    save('decimal', decimal)
    this.send('pcodeChanged')
  }

  set autoCompileOnLoad (autoCompileOnLoad: boolean) {
    this.#autoCompileOnLoad = autoCompileOnLoad
    save('autoCompileOnLoad', this.#autoCompileOnLoad)
    this.send('autoCompileOnLoadChanged')
  }

  set autoRunOnLoad (autoRunOnLoad: boolean) {
    this.#autoRunOnLoad = autoRunOnLoad
    save('autoRunOnLoad', this.#autoRunOnLoad)
    this.send('autoRunOnLoadChanged')
  }

  set autoFormatOnLoad (autoFormatOnLoad: boolean) {
    this.#autoFormatOnLoad = autoFormatOnLoad
    save('autoFormatOnLoad', this.#autoFormatOnLoad)
    this.send('autoFormatOnLoadChanged')
  }

  set alwaysSaveSettings (alwaysSaveSettings: boolean) {
    this.#alwaysSaveSettings = alwaysSaveSettings
    save('alwaysSaveSettings', alwaysSaveSettings)
    this.send('alwaysSaveSettingsChanged')
  }

  // setters for help page properties
  set commandsCategoryIndex (commandsCategoryIndex: number) {
    this.#commandsCategoryIndex = commandsCategoryIndex
    save('commandsCategoryIndex', commandsCategoryIndex)
    this.send('commandsCategoryIndexChanged')
  }

  set showSimpleCommands (showSimpleCommands: boolean) {
    this.#showSimpleCommands = showSimpleCommands
    save('showSimpleCommands', showSimpleCommands)
    this.send('showSimpleCommandsChanged')
  }

  set showIntermediateCommands (showIntermediateCommands: boolean) {
    this.#showIntermediateCommands = showIntermediateCommands
    save('showIntermediateCommands', showIntermediateCommands)
    this.send('showIntermediateCommandsChanged')
  }

  set showAdvancedCommands (showAdvancedCommands: boolean) {
    this.#showAdvancedCommands = showAdvancedCommands
    save('showAdvancedCommands', showAdvancedCommands)
    this.send('showAdvancedCommandsChanged')
  }

  // setters for file memory
  set files (files: File[]) {
    this.#files = files
    save('files', files)
    this.send('filesChanged')
  }

  set currentFileIndex (currentFileIndex: number) {
    this.#currentFileIndex = currentFileIndex
    save('currentFileIndex', currentFileIndex)

    // update language to match current file language
    this.language = this.file.language

    // update lexemes, pcode, and usage to match current file
    if (this.file.example && this.file.edited === false) {
      if (this.file.language !== 'Python') {
        const example = examples.find(x => x.id === this.file.example)
        if (example) {
          const filename = `${example.id}.tmx`
          window.fetch(`/examples/${this.language}/${example.groupId}/${filename}`)
            .then(response => {
              if (response.ok) {
                response.text().then(content => {
                  const json = JSON.parse(content)
                  const { lexemes, comments } = lexer(json.code, this.language)
                  this.pcode = json.pcode
                  this.usage = json.usage
                  this.lexemes = lexemes
                  this.comments = comments
                  this.file.compiled = true
                })
              }
            })
        }
      }
    } else if (this.file.compiled) {
      const { lexemes, pcode, usage } = compile(this.file.code, this.language)
      this.lexemes = lexemes
      this.pcode = pcode
      this.usage = usage
    } else {
      this.lexemes = []
      this.pcode = []
      this.usage = []
    }

    this.send('currentFileIndexChanged')
  }

  set filename (name: string) {
    this.file.name = name
    this.file.edited = true
    save('files', this.files)
    this.send('filenameChanged')
  }

  set code (code: string) {
    this.file.code = code
    this.file.edited = true
    this.file.compiled = false
    save('files', this.files)
    this.send('codeChanged')
  }

  set lexemes (lexemes: Lexeme[]) {
    this.#lexemes = lexemes
    save('lexemes', lexemes)
    this.send('lexemesChanged')
  }

  set comments (comments: Comment[]) {
    this.#comments = comments
    save('comments', comments)
    this.send('commentsChanged')
  }

  set routines (routines: any[]) {
    this.#routines = routines
    save('routines', routines)
    this.send('routinesChanged')
  }

  set pcode (pcode: number[][]) {
    this.#pcode = pcode
    save('pcode', pcode)
    this.send('pcodeChanged')
  }

  set usage (usage: any[]) {
    this.#usage = usage
    save('usage', usage)
    this.send('usageChanged')
  }

  // setters for machine runtime options
  set showCanvasOnRun (showCanvasOnRun: boolean) {
    this.#showCanvasOnRun = showCanvasOnRun
    save('showCanvasOnRun', showCanvasOnRun)
    this.send('showCanvasOnRunChanged')
  }

  set showOutputOnWrite (showOutputOnWrite: boolean) {
    this.#showOutputOnWrite = showOutputOnWrite
    save('showOutputOnWrite', showOutputOnWrite)
    this.send('showOutputOnWriteChanged')
  }

  set showMemoryOnDump (showMemoryOnDump: boolean) {
    this.#showMemoryOnDump = showMemoryOnDump
    save('showMemoryOnDump', showMemoryOnDump)
    this.send('showMemoryOnDumpChanged')
  }

  set drawCountMax (drawCountMax: number) {
    this.#drawCountMax = drawCountMax
    save('drawCountMax', drawCountMax)
    this.send('drawCountMaxChanged')
  }

  set codeCountMax (codeCountMax: number) {
    this.#codeCountMax = codeCountMax
    save('codeCountMax', codeCountMax)
    this.send('codeCountMaxChanged')
  }

  set smallSize (smallSize: number) {
    this.#smallSize = smallSize
    save('smallSize', smallSize)
    this.send('smallSizeChanged')
  }

  set stackSize (stackSize: number) {
    this.#stackSize = stackSize
    save('stackSize', stackSize)
    this.send('stackSizeChanged')
  }

  set traceOnRun (traceOnRun: boolean) {
    this.#traceOnRun = traceOnRun
    save('traceOnRun', traceOnRun)
    this.send('traceOnRunChanged')
  }

  set activateHCLR (activateHCLR: boolean) {
    this.#activateHCLR = activateHCLR
    save('activateHCLR', activateHCLR)
    this.send('activateHCLRChanged')
  }

  set preventStackCollision (preventStackCollision: boolean) {
    this.#preventStackCollision = preventStackCollision
    save('preventStackCollision', preventStackCollision)
    this.send('preventStackCollisionChanged')
  }

  set rangeCheckArrays (rangeCheckArrays: boolean) {
    this.#rangeCheckArrays = rangeCheckArrays
    save('rangeCheckArrays', rangeCheckArrays)
    this.send('rangeCheckArraysChanged')
  }

  // setters for compiler options
  set canvasStartSize (canvasStartSize: number) {
    this.#canvasStartSize = canvasStartSize
    save('canvasStartSize', canvasStartSize)
    this.send('canvasStartSizeChanged')
  }

  set setupDefaultKeyBuffer (setupDefaultKeyBuffer: boolean) {
    this.#setupDefaultKeyBuffer = setupDefaultKeyBuffer
    save('setupDefaultKeyBuffer', setupDefaultKeyBuffer)
    this.send('setupDefaultKeyBufferChanged')
  }

  set turtleAttributesAsGlobals (turtleAttributesAsGlobals: boolean) {
    this.#turtleAttributesAsGlobals = turtleAttributesAsGlobals
    save('turtleAttributesAsGlobals', turtleAttributesAsGlobals)
    this.send('turtleAttributesAsGlobalsChanged')
  }

  set initialiseLocals (initialiseLocals: boolean) {
    this.#initialiseLocals = initialiseLocals
    save('initialiseLocals', initialiseLocals)
    this.send('initialiseLocalsChanged')
  }

  set allowCSTR (allowCSTR: boolean) {
    this.#allowCSTR = allowCSTR
    save('allowCSTR', allowCSTR)
    this.send('allowCSTRChanged')
  }

  set separateReturnStack (separateReturnStack: boolean) {
    this.#separateReturnStack = separateReturnStack
    save('separateReturnStack', separateReturnStack)
    this.send('separateReturnStackChanged')
  }

  set separateMemoryControlStack (separateMemoryControlStack: boolean) {
    this.#separateMemoryControlStack = separateMemoryControlStack
    save('separateMemoryControlStack', separateMemoryControlStack)
    this.send('separateMemoryControlStackChanged')
  }

  set separateSubroutineRegisterStack (separateSubroutineRegisterStack: boolean) {
    this.#separateSubroutineRegisterStack = separateSubroutineRegisterStack
    save('separateSubroutineRegisterStack', separateSubroutineRegisterStack)
    this.send('separateSubroutineRegisterStackChanged')
  }

  // edit actions
  undo (): void {}

  redo (): void {}

  cut (): void {}

  copy (): void {}

  paste (): void {}

  selectAll (): void {}

  // save settings (requires login)
  async saveSettings (): Promise<void> {
    const response = await fetch('/status')
    const user = response.ok ? await response.json() : null
    if (user) {
      const settings: Partial<Record<Property, any>> = {
        // system settings
        language: this.language,
        mode: this.mode,
        editorFontFamily: this.editorFontFamily,
        editorFontSize: this.editorFontSize,
        outputFontFamily: this.outputFontFamily,
        outputFontSize: this.outputFontSize,
        includeCommentsInExamples: this.includeCommentsInExamples,
        loadCorrespondingExample: this.loadCorrespondingExample,
        assembler: this.assembler,
        decimal: this.decimal,
        autoCompileOnLoad: this.autoCompileOnLoad,
        autoRunOnLoad: this.autoRunOnLoad,
        autoFormatOnLoad: this.autoFormatOnLoad,
        alwaysSaveSettings: this.alwaysSaveSettings,
        // machine runtime options
        showCanvasOnRun: this.showCanvasOnRun,
        showOutputOnWrite: this.showOutputOnWrite,
        showMemoryOnDump: this.showMemoryOnDump,
        drawCountMax: this.drawCountMax,
        codeCountMax: this.codeCountMax,
        smallSize: this.smallSize,
        stackSize: this.stackSize,
        traceOnRun: this.traceOnRun,
        activateHCLR: this.activateHCLR,
        preventStackCollision: this.preventStackCollision,
        rangeCheckArrays: this.rangeCheckArrays,
        // compiler options
        canvasStartSize: this.canvasStartSize,
        setupDefaultKeyBuffer: this.setupDefaultKeyBuffer,
        turtleAttributesAsGlobals: this.turtleAttributesAsGlobals,
        initialiseLocals: this.initialiseLocals,
        allowCSTR: this.allowCSTR,
        separateReturnStack: this.separateReturnStack,
        separateMemoryControlStack: this.separateMemoryControlStack,
        separateSubroutineRegisterStack: this.separateSubroutineRegisterStack
      }
      const response = await fetch('/account/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (response.ok) {
        this.send('closeMenu', 'system')
      } else {
        this.send('error', new SystemError('Your settings could not be saved. Please try again later.'))
      }
    } else {
      this.send('error', new SystemError('You must be logged in to save your settings.'))
    }
  }

  async loadSavedSettings (): Promise<void> {
    const response = await fetch('/status')
    const user = response.ok ? await response.json() : null
    if (user && user.systemSettings) {
      this.savedSettingsHaveBeenLoaded = true
      // system settings
      this.language = user.systemSettings.language
      this.mode = user.systemSettings.mode
      this.editorFontFamily = user.systemSettings.editorFontFamily
      this.editorFontSize = user.systemSettings.editorFontSize
      this.outputFontFamily = user.systemSettings.outputFontFamily
      this.outputFontSize = user.systemSettings.outputFontSize
      this.includeCommentsInExamples = user.systemSettings.includeCommentsInExamples
      this.loadCorrespondingExample = user.systemSettings.loadCorrespondingExample
      this.assembler = user.systemSettings.assembler
      this.decimal = user.systemSettings.decimal
      this.autoCompileOnLoad = user.systemSettings.autoCompileOnLoad
      this.autoRunOnLoad = user.systemSettings.autoRunOnLoad
      this.autoFormatOnLoad = user.systemSettings.autoFormatOnLoad
      this.alwaysSaveSettings = user.systemSettings.alwaysSaveSettings
      // machine runtime options
      this.showCanvasOnRun = user.systemSettings.showCanvasOnRun
      this.showOutputOnWrite = user.systemSettings.showOutputOnWrite
      this.showMemoryOnDump = user.systemSettings.showMemoryOnDump
      this.drawCountMax = user.systemSettings.drawCountMax
      this.codeCountMax = user.systemSettings.codeCountMax
      this.smallSize = user.systemSettings.smallSize
      this.stackSize = user.systemSettings.stackSize
      this.traceOnRun = user.systemSettings.traceOnRun
      this.activateHCLR = user.systemSettings.activateHCLR
      this.preventStackCollision = user.systemSettings.preventStackCollision
      this.rangeCheckArrays = user.systemSettings.rangeCheckArrays
      // compiler options
      this.canvasStartSize = user.systemSettings.canvasStartSize
      this.setupDefaultKeyBuffer = user.systemSettings.setupDefaultKeyBuffer
      this.turtleAttributesAsGlobals = user.systemSettings.turtleAttributesAsGlobals
      this.initialiseLocals = user.systemSettings.initialiseLocals
      this.allowCSTR = user.systemSettings.allowCSTR
      this.separateReturnStack = user.systemSettings.separateReturnStack
      this.separateMemoryControlStack = user.systemSettings.separateMemoryControlStack
      this.separateSubroutineRegisterStack = user.systemSettings.separateSubroutineRegisterStack
    }
  }

  // reset default settings
  resetDefaults (): void {
    // system settings
    this.language = defaults.language
    this.mode = defaults.mode
    this.editorFontFamily = defaults.editorFontFamily
    this.editorFontSize = defaults.editorFontSize
    this.outputFontFamily = defaults.outputFontFamily
    this.outputFontSize = defaults.outputFontSize
    this.includeCommentsInExamples = defaults.includeCommentsInExamples
    this.loadCorrespondingExample = defaults.loadCorrespondingExample
    this.assembler = defaults.assembler
    this.decimal = defaults.decimal
    this.autoCompileOnLoad = defaults.autoCompileOnLoad
    this.autoRunOnLoad = defaults.autoRunOnLoad
    this.autoFormatOnLoad = defaults.autoFormatOnLoad
    this.alwaysSaveSettings = defaults.alwaysSaveSettings
    // machine runtime options
    this.showCanvasOnRun = defaults.showCanvasOnRun
    this.showOutputOnWrite = defaults.showOutputOnWrite
    this.showMemoryOnDump = defaults.showMemoryOnDump
    this.drawCountMax = defaults.drawCountMax
    this.codeCountMax = defaults.codeCountMax
    this.smallSize = defaults.smallSize
    this.stackSize = defaults.stackSize
    this.traceOnRun = defaults.traceOnRun
    this.activateHCLR = defaults.activateHCLR
    this.preventStackCollision = defaults.preventStackCollision
    this.rangeCheckArrays = defaults.rangeCheckArrays
    // compiler options
    this.canvasStartSize = defaults.canvasStartSize
    this.setupDefaultKeyBuffer = defaults.setupDefaultKeyBuffer
    this.turtleAttributesAsGlobals = defaults.turtleAttributesAsGlobals
    this.initialiseLocals = defaults.initialiseLocals
    this.allowCSTR = defaults.allowCSTR
    this.separateReturnStack = defaults.separateReturnStack
    this.separateMemoryControlStack = defaults.separateMemoryControlStack
    this.separateSubroutineRegisterStack = defaults.separateSubroutineRegisterStack
    // close the system menu
    this.send('closeMenu', 'system')
  }

  // add a file to the files array (and update current file index)
  addFile (file: File): void {
    this.files = this.files.concat([file])
    this.currentFileIndex = this.files.length - 1
    this.send('closeMenu', 'system')
    machine.halt()
  }

  // close the current file (and update current file index)
  closeCurrentFile (): void {
    this.files = this.files.slice(0, this.currentFileIndex).concat(this.files.slice(this.currentFileIndex + 1))
    if (this.files.length === 0) {
      this.newFile()
    } else if (this.currentFileIndex > this.files.length - 1) {
      this.currentFileIndex = this.currentFileIndex - 1
    }
    this.send('closeMenu', 'system')
  }

  // create a new file
  newFile (skeleton: boolean = false) {
    const file = new File(this.language)
    if (skeleton) {
      file.code = File.skeletons[this.language]
    }
    this.addFile(file)
  }

  // open a file from disk
  openFile (filename: string, content: string, example: string|null = null) {
    const file = new File(this.language, example)
    const bits = filename.split('.')
    const ext = bits.pop()
    const name = bits.join('.')
    let json: any
    switch (ext) {
      case 'tbas': // fallthrough
      case 'tgb': // support old file extension
        file.language = 'BASIC'
        file.name = name
        file.code = content.trim()
        break

      case 'tpas': // fallthrough
      case 'tgp': // support old file extension
        file.language = 'Pascal'
        file.name = name
        file.code = content.trim()
        break

      case 'tpy': // fallthrough
      case 'tgy': // support old file extension
        file.language = 'Python'
        file.name = name
        file.code = content.trim()
        break

      case 'tmx': // fallthrough
      case 'tgx': // support old file extension
        try {
          json = JSON.parse(content)
          if (json.language && json.name && json.code && json.usage && json.pcode) {
            file.language = json.language
            file.name = json.name
            file.code = json.code.trim()
          } else {
            this.send('error', new SystemError('Invalid TMX file.'))
          }
        } catch (ignore) {
          this.send('error', new SystemError('Invalid TMX file.'))
        }
        break

      case 'tmj': // pcode only; TODO; fallthrough for now
      case 'tmb': // pcode binary file; TODO; fallthrough for now
      default:
        throw new SystemError('Invalid file type.')
    }
    this.addFile(file)
    if (json) {
      const { lexemes, comments } = lexer(json.code.trim(), this.language)
      this.usage = json.usage
      this.lexemes = lexemes
      this.comments = comments
      this.pcode = json.pcode
      this.file.compiled = true
    }
  }

  openLocalFile () {
    const state = this
    const fileInput = input({
      type: 'file',
      on: ['change', function () {
        const file = fileInput.files[0]
        const fr = new FileReader()
        fr.onload = function () {
          state.openFile(file.name, fr.result as string)
        }
        fr.readAsText(file)
      }]
    })
    fileInput.click()
  }

  openRemoteFile (url: string) {
    this.send('error', new SystemError('Feature not yet available.'))
  }

  openExampleFile (exampleId: string) {
    const example = examples.find(x => x.id === exampleId)
    if (!example) {
      this.send('error', new SystemError(`Unknown example "${exampleId}".`))
    }
    const ext = (this.language === 'Python') ? File.extensions.Python : 'tmx'
    const filename = `${example.id}.${ext}`
    window.fetch(`/examples/${this.language}/${example.groupId}/${filename}`)
      .then(response => {
        if (response.ok) {
          response.text().then(content => {
            this.openFile(filename, content.trim(), exampleId)
          })
        } else {
          this.send('error', new SystemError(`Example "${exampleId}" is not available for Turtle ${this.language}.`))
        }
      })
  }

  saveLocalFile () {
    const a = document.createElement('a')
    const blob = new window.Blob([this.file.code], { type: 'text/plain;charset=utf-8' })
    a.setAttribute('href', URL.createObjectURL(blob))
    a.setAttribute('download', this.file.filename)
    a.click()
  }

  saveRemoteFile () {
    this.send('error', new SystemError('Feature not yet available.'))
  }

  compileCurrentFile (): void {
    try {
      const { lexemes, comments, pcode, usage } = compile(this.file.code, this.language)
      this.file.language = this.language
      this.file.compiled = true
      this.files = this.files // to update the session storage
      this.lexemes = lexemes
      this.comments = comments
      this.pcode = pcode
      this.usage = usage
    } catch (error) {
      this.send('error', error)
    }
  }

  backupCode (): void {
    this.file.backup = this.file.code
  }

  restoreCode (): void {
    if (this.file.code !== this.file.backup) {
      this.file.compiled = false
    }
    this.file.code = this.file.backup
  }

  // TODO: this should be in the machine module
  dumpMemory (): void {
    this.send('memoryDumped', machine.dump())
  }

  // play/pause the machine
  playPauseMachine () {
    if (machine.isRunning()) {
      if (machine.isPaused()) {
        machine.play()
      } else {
        machine.pause()
      }
    } else {
      if (!this.file.compiled) {
        this.compileCurrentFile()
      }
      if (this.file.compiled) {
        machine.run(this.pcode, this.machineOptions)
      }
    }
    this.send('closeMenu', 'system')
  }

  // register callback on the record of outgoing messages
  on (message: Message, callback: Reply) {
    if (this.#replies[message]) {
      this.#replies[message].push(callback)
    } else {
      this.#replies[message] = [callback]
    }
  }

  // function for executing any registered callbacks following a state change
  send (message: Message, data: any = null) {
    // execute any callbacks registered for this message
    if (this.#replies[message]) {
      this.#replies[message].forEach((callback: Reply) => {
        callback(data)
      })
    }

    // if the file has changed, reply that the file properties have changed as well
    if (message === 'currentFileIndexChanged') {
      this.send('filenameChanged')
      this.send('codeChanged')
    }
  }
}

// export a new system state object
export default new State()
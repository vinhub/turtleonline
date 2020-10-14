/** message type */
export type Message = typeof messages[number]

/** array of messages */
export const messages = [
  // system settings changed
  'languageChanged',
  'modeChanged',
  'editorFontFamilyChanged',
  'editorFontSizeChanged',
  'outputFontFamilyChanged',
  'outputFontSizeChanged',
  'includeCommentsInExamplesChanged',
  'loadCorrespondingExampleChanged',
  'assemblerChanged',
  'decimalChanged',
  'autoCompileOnLoadChanged',
  'autoRunOnLoadChanged',
  'autoFormatOnLoadChanged',
  'alwaysSaveSettingsChanged',
  // help page properties changed
  'commandsCategoryIndexChanged',
  'showSimpleCommandsChanged',
  'showIntermediateCommandsChanged',
  'showAdvancedCommandsChanged',
  // file memory changed
  'filesChanged',
  'currentFileIndexChanged',
  'filenameChanged',
  'codeChanged',
  'lexemesChanged',
  'programChanged',
  'usageChanged',
  'pcodeChanged',
  // machine runtime options changed
  'showCanvasOnRunChanged',
  'showOutputOnWriteChanged',
  'showMemoryOnDumpChanged',
  'drawCountMaxChanged',
  'codeCountMaxChanged',
  'smallSizeChanged',
  'stackSizeChanged',
  'traceOnRunChanged',
  'activateHCLRChanged',
  'preventStackCollisionChanged',
  'rangeCheckArraysChanged',
  // compiler options changed
  'canvasStartSizeChanged',
  'setupDefaultKeyBufferChanged',
  'turtleAttributesAsGlobalsChanged',
  'initialiseLocalsChanged',
  'allowCSTRChanged',
  'separateReturnStackChanged',
  'separateMemoryControlStackChanged',
  'separateSubroutineRegisterStackChanged',
  // other system messages (not involving state change)
  'systemReady',
  'toggleMenu',
  'openMenu',
  'closeMenu',
  'toggleSystemMenu',
  'openSystemMenu',
  'closeSystemMenu',
  'selectTab',
  'memoryDumped',
  'selectAll',
  'error',
  // machine messages
  'canvasContextReady',
  'played',
  'paused',
  'unpaused',
  'halted',
  'resolution',
  'canvas',
  'cursor',
  'print',
  'line',
  'poly',
  'arc',
  'box',
  'pixset',
  'blank',
  'flood',
  'log',
  'backspace',
  'console',
  'write',
  'output',
  'turtxChanged',
  'turtyChanged',
  'turtdChanged',
  'turtaChanged',
  'turttChanged',
  'turtcChanged'
] as const

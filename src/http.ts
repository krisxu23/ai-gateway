/** 读响应体的前 cap 字节；返回 null 表示超限（此时已取消该 body，不再继续拉上游流量）。
 *
 *  诊断与失败回放只需要前缀：整包读会把几十 MB 读进内存，而 Worker 的内存上限
 *  只有 128MB，每个 Key 各缓冲一份足以把 isolate 打爆。按声明长度预判不够
 *  （chunked 体没有 content-length），所以按实际读到的字节数卡。 */
export async function readCappedBytes(response: Response, cap: number): Promise<Uint8Array | null> {
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array()
  const parts: Uint8Array[] = []
  let bytes = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > cap) {
        await reader.cancel().catch(() => {})
        return null
      }
      parts.push(value)
    }
  } catch {
    // 流中断：已读到的部分仍有诊断价值
  }
  const out = new Uint8Array(bytes)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.byteLength
  }
  return out
}

/** readCappedBytes 的文本版本（按整段字节解码，多字节字符跨块不会被截断） */
export async function readCappedText(response: Response, cap: number): Promise<string | null> {
  const bytes = await readCappedBytes(response, cap)
  return bytes === null ? null : new TextDecoder().decode(bytes)
}

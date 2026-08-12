function History() {
  return (
    <section className="py-16 border-t border-ink-black">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-7 pr-0 md:pr-8 md:border-r border-ink-black">
          <h2 className="font-display-lg text-display-lg text-ink-black italic leading-tight">
            &ldquo;From &lsquo;Number Place&rsquo; to a Global
            Phenomenon.&rdquo;
          </h2>
        </div>
        <div className="md:col-span-5 pl-0 md:pl-8 flex flex-col gap-6">
          <p className="font-body-md text-body-md text-ink-black">
            Originating in 1979 in the United States as &ldquo;Number
            Place,&rdquo; the elegant logic puzzle was initially published in
            specialized magazines, quietly challenging readers with its simple
            premise and complex deductions.
          </p>
          <p className="font-body-md text-body-md text-ink-black">
            It wasn&rsquo;t until 1984 that the puzzle found its true name and
            widespread popularity in Japan, championed by the puzzle publisher
            Nikoli. Translated to &ldquo;the digits must be single,&rdquo;
            Sudoku became a staple of daily mental exercise worldwide.
          </p>
        </div>
      </div>
    </section>
  );
}

export default History;

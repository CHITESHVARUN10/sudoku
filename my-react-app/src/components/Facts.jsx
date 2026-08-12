const FACTS = [
  {
    number: "1",
    title: "Sharpens working memory",
    description: "Engaging with the grid actively builds cognitive reserve.",
  },
  {
    number: "2",
    title: "Pure logic, no math",
    description:
      "Success relies entirely on deduction, making it universally accessible.",
  },
  {
    number: "3",
    title: "A meditative state",
    description:
      "The focused attention required induces a flow state of calm.",
  },
];

function Facts() {
  return (
    <section className="py-16 border-t border-ink-black mb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-ink-black">
        {FACTS.map((fact, index) => (
          <div
            key={fact.number}
            className={`flex flex-col gap-4 p-8 ${
              index === 0 ? "md:pl-0" : index === FACTS.length - 1 ? "md:pr-0" : ""
            }`}
          >
            <div className="w-12 h-12 rounded-full border border-ink-black flex items-center justify-center font-grid-number text-grid-number text-ink-blue">
              {fact.number}
            </div>
            <h3 className="font-headline-sm text-headline-sm text-ink-black font-semibold">
              {fact.title}
            </h3>
            <p className="font-body-md text-body-md text-secondary">
              {fact.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Facts;

const skills = ["Next.js", "React", "TypeScript", "Tailwind CSS"];

const highlights = [
  {
    title: "Vibe Coding",
    body: "아이디어를 빠르게 화면으로 옮기며 프론트엔드 개발 감각을 키우고 있습니다.",
  },
  {
    title: "Clean UI",
    body: "읽기 쉬운 구조와 명확한 사용자 흐름을 중요하게 생각합니다.",
  },
  {
    title: "Learning Log",
    body: "작게 만들고, 실행하고, 고치면서 매일 조금씩 성장합니다.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFF08A] text-black">
      <header className="sticky top-0 z-10 border-b-[3px] border-black bg-[#FFF08A]/95 px-4 py-3 backdrop-blur md:px-8 lg:px-12">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <a className="text-xl font-black" href="#top">
            MyLink Creator
          </a>
          <div className="hidden items-center gap-6 text-sm font-black md:flex">
            <a href="#about">소개</a>
            <a href="#skills">기술</a>
            <a href="#contact">연락</a>
          </div>
        </nav>
      </header>

      <section
        id="top"
        className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1fr_320px] md:items-center md:px-8 md:py-16 lg:min-h-[76svh] lg:grid-cols-[1.08fr_0.92fr] lg:px-12 lg:py-20"
      >
        <div>
          <p className="mb-4 inline-block border-[3px] border-black bg-white px-4 py-2 text-sm font-black shadow-[4px_4px_0_#000]">
            Frontend Learner
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-none md:text-6xl lg:text-7xl">
            MyLink Creator
          </h1>
          <p className="mt-6 max-w-2xl text-xl font-bold leading-9 md:text-2xl">
            안녕하세요! 바이브 코딩을 배우고 있는 대학생입니다.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="border-[3px] border-black bg-black px-6 py-4 text-center font-black text-white shadow-[6px_6px_0_#000] transition-transform hover:-translate-y-1"
              href="#skills"
            >
              기술 보기
            </a>
            <a
              className="border-[3px] border-black bg-white px-6 py-4 text-center font-black shadow-[6px_6px_0_#000] transition-transform hover:-translate-y-1"
              href="#contact"
            >
              연락하기
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[360px] md:max-w-none">
          <div className="border-[3px] border-black bg-[#9DD9D2] p-5 shadow-[8px_8px_0_#000] lg:p-7">
            <div className="flex aspect-square items-center justify-center rounded-full border-[3px] border-black bg-white text-8xl font-black md:text-9xl">
              신
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-center text-sm font-black">
              <span className="border-[3px] border-black bg-white px-3 py-2">
                Student
              </span>
              <span className="border-[3px] border-black bg-[#FFB3C7] px-3 py-2">
                Builder
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="about"
        className="border-y-[3px] border-black bg-white px-4 py-12 md:px-8 lg:px-12"
      >
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-start">
          <h2 className="text-4xl font-black md:text-5xl">About</h2>
          <p className="text-lg font-bold leading-8 md:text-xl md:leading-9">
            새로운 도구를 써보며 직접 만들고 배우는 과정을 좋아합니다.
            작은 화면부터 전체 페이지까지 차근차근 완성도를 높여가고
            있습니다.
          </p>
        </div>
      </section>

      <section
        id="skills"
        className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16 lg:px-12"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="text-4xl font-black md:text-5xl">Skills</h2>
          <p className="max-w-xl text-lg font-bold leading-8">
            지금은 웹 페이지 구조, 스타일링, 컴포넌트 기반 개발을 중심으로
            익히고 있습니다.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((skill) => (
            <div
              className="border-[3px] border-black bg-white p-5 text-xl font-black shadow-[6px_6px_0_#000]"
              key={skill}
            >
              {skill}
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              className="border-[3px] border-black bg-[#9DD9D2] p-5 shadow-[6px_6px_0_#000]"
              key={item.title}
            >
              <h3 className="text-2xl font-black">{item.title}</h3>
              <p className="mt-4 font-bold leading-7">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="border-t-[3px] border-black bg-black px-4 py-12 text-white md:px-8 lg:px-12"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-4xl font-black md:text-5xl">Contact</h2>
            <p className="mt-4 max-w-xl text-lg font-bold leading-8 text-white/80">
              더 좋은 페이지를 만들기 위해 계속 배우고 기록합니다.
            </p>
          </div>
          <a
            className="border-[3px] border-white bg-[#FFF08A] px-6 py-4 text-center font-black text-black shadow-[6px_6px_0_#fff] transition-transform hover:-translate-y-1"
            href="mailto:creator@example.com"
          >
            이메일 보내기
          </a>
        </div>
      </section>
    </main>
  );
}

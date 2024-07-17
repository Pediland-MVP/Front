"use client";
import React, { useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { Button, Input } from "@nextui-org/react";
import { Password } from "@phosphor-icons/react";
import AuthHeader from "../../layout/header";

export default function SetPassword() {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleInputChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = event.target;
    if (/^\d$/.test(value)) {
      if (index < inputsRef.current.length - 1) {
        inputsRef.current[index + 1]?.focus();
      } else if (index === inputsRef.current.length - 1) {
        buttonRef.current?.focus();
      }
    } else {
      event.target.value = "";
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && event.currentTarget.value === "") {
      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0]?.focus();
    }
  }, []);

  return (
    <main className="_set-password h-full relative">
      <AuthHeader />

      <div className="container max-w-6xl flex items-center justify-center h-full">
        <div className="text-center w-full sm:w-1/3 mx-auto px-3 sm:px-0">
          <div className="_heading flex items-center justify-center gap-2 mb-6">
            <Password size={28} />
            <h1 className="text-xl font-semibold">تایید شماره همراه</h1>
          </div>
          <div className="_form">
            <div className="grid grid-cols-5 gap-2 mb-5 ltr">
              {[4, 3, 2, 1, 0].map((i) => (
                <Input
                  key={i}
                  type="text"
                  className="col-span-1"
                  classNames={{
                    input: "text-center font-semibold text-xl",
                  }}
                  size="lg"
                  maxLength={1}
                  onChange={(e) => handleInputChange(i, e)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  ref={(el) => (inputsRef.current[i] = el)}
                  inputMode="numeric"
                  pattern="\d*"
                />
              ))}
            </div>
            <Button
              className="w-full text-white"
              color="success"
              radius="full"
              size="lg"
              ref={buttonRef}
            >
              ارسـال
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

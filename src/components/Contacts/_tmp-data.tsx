<div className="grid grid-cols-4 gap-4">
          <div className="col-span-4 md:col-span-2">
            <Input
              id="firstname"
              {...register("firstname")}
              className="col-span-3"
            />
            {errors.firstname && (
              <p className="col-span-4 text-sm text-red-500">
                {t("errors.firstname")}
              </p>
            )}
          </div>

          <div className="col-span-4 md:col-span-2">
            <Label htmlFor="lastname" className="text-right">
              {t("lastname")}
            </Label>
            <Input
              id="lastname"
              {...register("lastname")}
              className="col-span-3"
            />
            {errors.lastname && (
              <p className="col-span-4 text-sm text-red-500">
                {t("errors.lastname")}
              </p>
            )}
          </div>

          <div className="col-span-4 md:col-span-2">
            <Label htmlFor="gender" className="text-right">
              {t("gender")}
            </Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => {
                if (field.value === undefined) {
                  return <></>;
                }
                return (
                  <Select
                    dir="rtl"
                    onValueChange={field.onChange}
                    defaultValue={field.value!}
                    value={field.value!}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t("genderPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">{t("female")}</SelectItem>
                      <SelectItem value="male">{t("male")}</SelectItem>
                      <SelectItem value="other">{t("other")}</SelectItem>
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {errors.gender && (
              <p className="col-span-4 text-sm text-red-500">
                {t("errors.gender")}
              </p>
            )}
          </div>

          <div className="col-span-4 md:col-span-2">
            <Label htmlFor="birthDate" className="mb-3 text-right">
              {t("birthDate")}
            </Label>
            <Controller
              control={control}
              name="birthDate"
              rules={{ required: true }}
              render={({
                field: { onChange, name, value },
                fieldState: { invalid, isDirty },
                formState: { errors },
              }) => (
                <>
                  <DatePicker
                    containerClassName="w-full"
                    style={{ width: "100%" }}
                    value={
                      value
                        ? new DateObject(+value)
                            .setLocale(persian_fa)
                            .setCalendar(persian)
                            .format("YYYY/MM/DD")
                        : ""
                    }
                    onChange={(date) => {
                      onChange(
                        date?.isValid ? (date.unix * 1000).toString() : "",
                      );
                    }}
                    format={"YYYY/MM/DD"}
                    calendar={persian}
                    locale={persian_fa}
                    render={<Input name="birthDate" />}
                  />
                  {errors &&
                    errors[name] &&
                    errors[name].type === "required" && (
                      <span>{t("errors.birthDateRequired")}</span>
                    )}
                </>
              )}
            />
            {errors.birthDate && (
              <p className="col-span-4 text-sm text-red-500">
                {t("errors.birthDate")}
              </p>
            )}
          </div>

          <div className="col-span-4 md:col-span-2">
            <Label htmlFor="mobile" className="text-right">
              {t("mobile")}
            </Label>
            <Input id="mobile" {...register("mobile")} className="col-span-3" />
            {errors.mobile && (
              <p className="col-span-4 text-sm text-red-500">
                {t("errors.mobile")}
              </p>
            )}
          </div>

          <div className="col-span-4 md:col-span-2">
            <Label htmlFor="email" className="text-right">
              {t("email")}
            </Label>
            <Input id="email" {...register("email")} className="col-span-3" />
            {errors.email && (
              <p className="col-span-4 text-sm text-red-500">
                {t("errors.email")}
              </p>
            )}
          </div>

          <div className="col-span-4 md:col-span-2">
            <Label htmlFor="country" className="text-right">
              {t("state")}
            </Label>
            <Input id="state" {...register("state")} className="col-span-3" />
            {errors.state && (
              <p className="col-span-4 text-sm text-red-500">
                {t("errors.state")}
              </p>
            )}
          </div>

          <div className="col-span-4 md:col-span-2">
            <Label htmlFor="city" className="text-right">
              {t("city")}
            </Label>
            <Input id="city" {...register("city")} className="col-span-3" />
            {errors.city && (
              <p className="col-span-4 text-sm text-red-500">
                {t("errors.city")}
              </p>
            )}
          </div>

          <div className="col-span-4">
            <Label htmlFor="address" className="text-right">
              {t("address")}
            </Label>
            <Input
              id="address"
              {...register("address")}
              className="col-span-3"
            />
            {errors.address && (
              <p className="col-span-4 text-sm text-red-500">
                {t("errors.address")}
              </p>
            )}
          </div>

          <div className="col-span-4">
            <Label htmlFor="postalcode" className="text-right">
              {t("postalcode")}
            </Label>
            <Input
              id="postalcode"
              {...register("postalcode")}
              className="col-span-3"
            />
            {errors.postalcode && (
              <p className="col-span-4 text-sm text-red-500">
                {t("errors.postalcode")}
              </p>
            )}
          </div>
        </div>